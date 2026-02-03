"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const tenantDb_1 = require("../database/tenantDb");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');
// Get user settings
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }
        const user = await tenantDb_1.tenantDb.direct.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                company: true,
                timezone: true,
                email_notifications: true,
                push_notifications: true,
                sms_notifications: true,
                two_factor_enabled: true,
                theme: true,
                font_size: true,
                language: true,
                region: true,
                date_format: true,
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        res.json(user);
    }
    catch (error) {
        next(error);
    }
});
// Update profile settings
router.put('/profile', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { name, email, company, timezone } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }
        const user = await tenantDb_1.tenantDb.direct.users.update({
            where: { id: userId },
            data: {
                name,
                email,
                company,
                timezone,
            },
            select: {
                id: true,
                email: true,
                name: true,
                company: true,
                timezone: true,
            }
        });
        res.json({ message: 'Profil güncellendi', user });
    }
    catch (error) {
        next(error);
    }
});
// Update notification settings
router.put('/notifications', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { emailNotifications, pushNotifications, smsNotifications } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }
        const user = await tenantDb_1.tenantDb.direct.users.update({
            where: { id: userId },
            data: {
                email_notifications: emailNotifications,
                push_notifications: pushNotifications,
                sms_notifications: smsNotifications,
            },
            select: {
                email_notifications: true,
                push_notifications: true,
                sms_notifications: true,
            }
        });
        res.json({ message: 'Bildirim ayarları güncellendi', user });
    }
    catch (error) {
        next(error);
    }
});
// Update password
router.put('/security/password', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gereklidir' });
        }
        const user = await tenantDb_1.tenantDb.direct.users.findUnique({
            where: { id: userId },
            select: { password_hash: true }
        });
        if (!user || !user.password_hash) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        const isValid = await bcrypt_1.default.compare(currentPassword, user.password_hash);
        if (!isValid) {
            return res.status(400).json({ error: 'Mevcut şifre yanlış' });
        }
        const newPasswordHash = await bcrypt_1.default.hash(newPassword, BCRYPT_ROUNDS);
        await tenantDb_1.tenantDb.direct.users.update({
            where: { id: userId },
            data: { password_hash: newPasswordHash }
        });
        res.json({ message: 'Şifre güncellendi' });
    }
    catch (error) {
        next(error);
    }
});
// Toggle 2FA
router.put('/security/2fa', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { enabled } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }
        const user = await tenantDb_1.tenantDb.direct.users.update({
            where: { id: userId },
            data: {
                two_factor_enabled: enabled,
            },
            select: {
                two_factor_enabled: true,
            }
        });
        res.json({ message: enabled ? '2FA etkinleştirildi' : '2FA devre dışı bırakıldı', user });
    }
    catch (error) {
        next(error);
    }
});
// Update appearance settings
router.put('/appearance', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { theme, fontSize } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }
        const user = await tenantDb_1.tenantDb.direct.users.update({
            where: { id: userId },
            data: {
                theme,
                font_size: fontSize,
            },
            select: {
                theme: true,
                font_size: true,
            }
        });
        res.json({ message: 'Görünüm ayarları güncellendi', user });
    }
    catch (error) {
        next(error);
    }
});
// Update language & region settings
router.put('/language', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { language, region, dateFormat } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }
        const user = await tenantDb_1.tenantDb.direct.users.update({
            where: { id: userId },
            data: {
                language,
                region,
                date_format: dateFormat,
            },
            select: {
                language: true,
                region: true,
                date_format: true,
            }
        });
        res.json({ message: 'Dil ve bölge ayarları güncellendi', user });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
