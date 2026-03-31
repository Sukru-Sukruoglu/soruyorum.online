import fs from 'fs';
import path from 'path';

export const QANDA_PDF_VERSION = 2;

export type QandaPdfRow = {
    createdAt: any;
    participantName?: string | null;
    questionText?: string | null;
    status?: string | null;
    isAnswered?: boolean | null;
};

const pdfFontCandidates = {
    regular: [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
        '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    ],
    bold: [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
    ],
};

const pdfFonts = {
    regular: pdfFontCandidates.regular.find((candidate) => fs.existsSync(candidate)) ?? null,
    bold: pdfFontCandidates.bold.find((candidate) => fs.existsSync(candidate)) ?? null,
};

function setPdfFont(doc: any, weight: 'regular' | 'bold' = 'regular') {
    const fontPath = pdfFonts[weight];
    if (fontPath) {
        doc.font(path.resolve(fontPath));
    }

    return doc;
}

export async function buildQandaPdfBase64(params: {
    eventName: string;
    generatedAt: Date;
    rows: QandaPdfRow[];
}): Promise<string> {
    const { default: PDFDocument } = await import('pdfkit');

    const doc = new (PDFDocument as any)({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const done = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });

    const title = `${params.eventName || 'Etkinlik'} - Soru/Yorum Raporu`;
    setPdfFont(doc, 'bold').fontSize(18).fillColor('#111').text(title);
    doc.moveDown(0.25);
    setPdfFont(doc)
        .fontSize(10)
        .fillColor('#444')
        .text(`Oluşturulma: ${params.generatedAt.toISOString()}`);
    doc.moveDown(1);
    doc.fillColor('#000');

    if (!params.rows?.length) {
        setPdfFont(doc).fontSize(11).text('Kayıtlı soru/yorum bulunamadı.');
        doc.end();
        const buffer = await done;
        return buffer.toString('base64');
    }

    setPdfFont(doc, 'bold').fontSize(11).text('Soru/Yorumlar', { underline: true });
    doc.moveDown(0.5);
    setPdfFont(doc).fontSize(10);

    for (let i = 0; i < params.rows.length; i++) {
        const row = params.rows[i];
        const who = (row.participantName || '').trim() || 'Anonim';
        const when = row.createdAt ? new Date(row.createdAt).toISOString() : '';
        const status = row.status ? String(row.status) : '';
        const answered = row.isAnswered === true ? 'answered' : row.isAnswered === false ? 'unanswered' : '';

        setPdfFont(doc)
            .fillColor('#111')
            .text(`${i + 1}. ${who} — ${when}${status ? ` — ${status}` : ''}${answered ? ` — ${answered}` : ''}`);
        setPdfFont(doc)
            .fillColor('#000')
            .text(String(row.questionText || ''), { indent: 12 });
        doc.moveDown(0.5);

        if (doc.y > 760) {
            doc.addPage();
        }
    }

    doc.end();
    const buffer = await done;
    return buffer.toString('base64');
}