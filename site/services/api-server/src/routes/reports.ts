import express from 'express';
import { tenantContextMiddleware } from '../middleware/tenantContext';
import { tenantDb } from '../database/tenantDb';

const router = express.Router();
router.use(tenantContextMiddleware);

const mapReportForFrontend = (report: any) => {
    if (!report) return report;

    const generatedAt = report.generatedAt ?? report.generated_at;
    const fileUrl = report.fileUrl ?? report.file_url;
    const eventId = report.eventId ?? report.event_id;

    const event = report.event || report.events;
    const eventName = event?.name ?? report.eventName ?? null;

    return {
        ...report,
        id: report.id,
        eventId,
        eventName,
        type: report.type ?? null,
        format: report.format ?? null,
        fileUrl,
        generatedAt,
    };
};

router.get('/', async (req, res, next) => {
    try {
        const reports = await tenantDb.direct.reports.findMany({
            where: {
                events: {
                    organization_id: req.organizationId,
                },
            } as any,
            include: {
                events: {
                    select: { id: true, name: true },
                },
            } as any,
            orderBy: { generated_at: 'desc' } as any,
        });

        res.json({ reports: (reports || []).map(mapReportForFrontend) });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/download', async (req, res, next) => {
    try {
        const reportId = req.params.id;
        const requestedFormat = String(req.query.format || '').toLowerCase();

        const report = await tenantDb.direct.reports.findFirst({
            where: {
                id: reportId,
                events: {
                    organization_id: req.organizationId,
                },
            } as any,
            include: {
                events: { select: { id: true, name: true } },
            } as any,
        });

        if (!report) {
            return res.status(404).json({ error: 'Rapor bulunamadı' });
        }

        // Use requested format if provided, otherwise fall back to report.format
        const storedFormat = String(report.format || '').toLowerCase();
        const format = requestedFormat || (storedFormat === 'multi' ? 'pdf' : storedFormat);
        
        const eventName = (report as any)?.events?.name || 'etkinlik';
        const safeName = String(eventName)
            .replace(/[^\w\d\-_. ]+/g, '')
            .trim()
            .slice(0, 60) || 'etkinlik';

        // Q&A CSV reports are stored in report.data.csv
        if (format === 'csv') {
            const csv = (report as any)?.data?.csv;
            if (!csv) {
                return res.status(400).json({ error: 'Rapor içeriği bulunamadı' });
            }

            // Add BOM for Excel UTF-8 compatibility
            const csvWithBom = '\uFEFF' + String(csv);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${safeName}-${String((report as any).event_id).slice(0, 8)}-rapor.csv"`);
            return res.status(200).send(csvWithBom);
        }

        if (format === 'xlsx') {
            const xlsxBase64 = (report as any)?.data?.xlsxBase64;
            if (!xlsxBase64) {
                return res.status(400).json({ error: 'Excel rapor içeriği bulunamadı' });
            }

            const xlsxBuffer = Buffer.from(String(xlsxBase64), 'base64');
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${safeName}-${String((report as any).event_id).slice(0, 8)}-rapor.xlsx"`
            );
            return res.status(200).send(xlsxBuffer);
        }

        if (format === 'pdf') {
            const pdfBase64 = (report as any)?.data?.pdfBase64;
            if (!pdfBase64) {
                return res.status(400).json({ error: 'PDF rapor içeriği bulunamadı' });
            }

            const pdfBuffer = Buffer.from(String(pdfBase64), 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${safeName}-${String((report as any).event_id).slice(0, 8)}-rapor.pdf"`);
            return res.status(200).send(pdfBuffer);
        }

        // Default: JSON download
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}-${String((report as any).event_id).slice(0, 8)}-rapor.json"`);
        return res.status(200).send(JSON.stringify((report as any)?.data ?? {}, null, 2));
    } catch (error) {
        next(error);
    }
});

export default router;
