"use strict";
/**
 * Event Permission Utilities
 *
 * Bu modül etkinlik yönetim yetkilerini kontrol eder.
 * Etkinlik ayarlarında "adminCanManage" ve "moderatorCanManage"
 * seçeneklerine göre yetki kontrolü yapar.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.canManageEventSteps = canManageEventSteps;
exports.requireEventManagePermission = requireEventManagePermission;
exports.getEventPermissions = getEventPermissions;
const server_1 = require("@trpc/server");
/**
 * Kullanıcının etkinlik adımlarını yönetme yetkisi var mı kontrol eder.
 *
 * @param userRole - Kullanıcının rolü (admin, moderator, organizer)
 * @param eventSettings - Etkinlik settings objesi
 * @returns true eğer kullanıcı yetkiliyse
 */
function canManageEventSteps(userRole, eventSettings) {
    const gameplay = eventSettings?.gameplay || {};
    // Varsayılan değerler: admin her zaman yönetebilir, moderator varsayılan kapalı
    const adminCanManage = gameplay.adminCanManage !== false; // undefined veya true ise true
    const moderatorCanManage = gameplay.moderatorCanManage === true;
    if (userRole === 'admin' && adminCanManage) {
        return true;
    }
    if (userRole === 'moderator' && moderatorCanManage) {
        return true;
    }
    // Organizer (etkinlik sahibi) her zaman yönetebilir
    if (userRole === 'organizer') {
        return true;
    }
    return false;
}
/**
 * Kullanıcının etkinlik adımlarını yönetme yetkisi yoksa hata fırlatır.
 */
function requireEventManagePermission(userRole, eventSettings, action = 'manage event steps') {
    if (!canManageEventSteps(userRole, eventSettings)) {
        throw new server_1.TRPCError({
            code: 'FORBIDDEN',
            message: `You don't have permission to ${action}. Your role (${userRole}) is not authorized for this event.`
        });
    }
}
/**
 * Etkinlik yönetim yetkileri için detaylı bilgi döndürür.
 */
function getEventPermissions(userRole, eventSettings) {
    const gameplay = eventSettings?.gameplay || {};
    const isAdmin = userRole === 'admin';
    const isModerator = userRole === 'moderator';
    const isOrganizer = userRole === 'organizer';
    const adminCanManage = gameplay.adminCanManage !== false;
    const moderatorCanManage = gameplay.moderatorCanManage === true;
    const canHostReset = gameplay.canHostReset === true;
    const canManageSteps = (isAdmin && adminCanManage) ||
        (isModerator && moderatorCanManage) ||
        isOrganizer;
    // Reset yetkisi: canHostReset açıksa ve yönetim yetkisi varsa
    const canResetEvent = canHostReset && canManageSteps;
    return {
        canManageSteps,
        canResetEvent,
        isAdmin,
        isModerator,
        isOrganizer
    };
}
