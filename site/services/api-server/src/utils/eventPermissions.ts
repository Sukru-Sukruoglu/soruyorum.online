/**
 * Event Permission Utilities
 * 
 * Bu modül etkinlik yönetim yetkilerini kontrol eder.
 * Etkinlik ayarlarında "adminCanManage" ve "moderatorCanManage" 
 * seçeneklerine göre yetki kontrolü yapar.
 */

import { TRPCError } from "@trpc/server";

export interface EventSettings {
    gameplay?: {
        adminCanManage?: boolean;
        moderatorCanManage?: boolean;
        [key: string]: any;
    };
    [key: string]: any;
}

export interface UserContext {
    id: string;
    email?: string;
    role: string;
    organizationId: string;
}

/**
 * Kullanıcının etkinlik adımlarını yönetme yetkisi var mı kontrol eder.
 * 
 * @param userRole - Kullanıcının rolü (admin, moderator, organizer)
 * @param eventSettings - Etkinlik settings objesi
 * @returns true eğer kullanıcı yetkiliyse
 */
export function canManageEventSteps(
    userRole: string,
    eventSettings: EventSettings | null | undefined
): boolean {
    const gameplay = eventSettings?.gameplay || {};
    
    // Eğer ayarlar hiç tanımlanmamışsa, herkes (admin, moderator, organizer) yönetebilir
    const hasAdminSetting = gameplay.adminCanManage !== undefined;
    const hasModeratorSetting = gameplay.moderatorCanManage !== undefined;
    
    // Eğer hiçbir ayar yoksa, varsayılan olarak izin ver (eski davranış)
    if (!hasAdminSetting && !hasModeratorSetting) {
        return true;
    }
    
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
export function requireEventManagePermission(
    userRole: string,
    eventSettings: EventSettings | null | undefined,
    action: string = 'manage event steps'
): void {
    if (!canManageEventSteps(userRole, eventSettings)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: `You don't have permission to ${action}. Your role (${userRole}) is not authorized for this event.`
        });
    }
}

/**
 * Etkinlik yönetim yetkileri için detaylı bilgi döndürür.
 */
export function getEventPermissions(
    userRole: string,
    eventSettings: EventSettings | null | undefined
): {
    canManageSteps: boolean;
    canResetEvent: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    isOrganizer: boolean;
} {
    const gameplay = eventSettings?.gameplay || {};
    
    const isAdmin = userRole === 'admin';
    const isModerator = userRole === 'moderator';
    const isOrganizer = userRole === 'organizer';
    
    const adminCanManage = gameplay.adminCanManage !== false;
    const moderatorCanManage = gameplay.moderatorCanManage === true;
    const canHostReset = gameplay.canHostReset === true;
    
    const canManageSteps = 
        (isAdmin && adminCanManage) || 
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
