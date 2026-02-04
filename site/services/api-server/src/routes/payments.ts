import express from 'express';
import { tenantContextMiddleware } from '../middleware/tenantContext';
import { tenantDb } from '../database/tenantDb';
import { getOrganizationAccess, isSuperAdmin } from '../utils/access';

const router = express.Router();
router.use(tenantContextMiddleware);

router.get('/access', async (req, res, next) => {
    try {
        const access = await getOrganizationAccess(tenantDb.direct as any, req.organizationId!);
        const superAdminBypass = isSuperAdmin({ role: req.userRole, email: req.userEmail });

        const effective = superAdminBypass
            ? {
                  ...access,
                  isFreeOrTrial: false,
                  isExpired: false,
              }
            : access;

        res.json({
            access: {
                ...effective,
                trialEndsAt: effective.trialEndsAt instanceof Date ? effective.trialEndsAt.toISOString() : (effective as any).trialEndsAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
