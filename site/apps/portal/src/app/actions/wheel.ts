"use server"

import { prisma as db } from "@ks-interaktif/database"
import { revalidatePath } from "next/cache"
import { randomBytes, randomUUID } from "crypto"

// Vibrant rainbow colors for wheel slices
const VIBRANT_COLORS = [
    '#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#ADFF2F', '#00FF00',
    '#00FA9A', '#00FFFF', '#00BFFF', '#1E90FF', '#4169E1', '#8A2BE2',
    '#9400D3', '#FF00FF', '#FF1493', '#DC143C', '#FF6347', '#FFA500',
    '#32CD32', '#00CED1', '#4682B4', '#6A5ACD', '#BA55D3', '#C71585'
]

const DEFAULT_PRIZES = [
    { id: '1', name: 'iPhone 15 Pro', description: 'Apple iPhone 15 Pro 256GB', color: VIBRANT_COLORS[0], icon: 'Smartphone', probability: 1, stockQuantity: 1, remainingStock: 1, isActive: true, displayOrder: 0 },
    { id: '2', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[1], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 1 },
    { id: '3', name: '%50 İndirim', description: 'Tüm ürünlerde %50 indirim', color: VIBRANT_COLORS[2], icon: 'Ticket', probability: 3, stockQuantity: 50, remainingStock: 50, isActive: true, displayOrder: 2 },
    { id: '4', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[3], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 3 },
    { id: '5', name: 'Kahve Hediye', description: 'Starbucks hediye kartı', color: VIBRANT_COLORS[4], icon: 'Coffee', probability: 5, stockQuantity: 100, remainingStock: 100, isActive: true, displayOrder: 4 },
    { id: '6', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[5], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 5 },
    { id: '7', name: 'AirPods', description: 'Apple AirPods Pro 2', color: VIBRANT_COLORS[6], icon: 'Crown', probability: 2, stockQuantity: 5, remainingStock: 5, isActive: true, displayOrder: 6 },
    { id: '8', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[7], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 7 },
    { id: '9', name: 'Pizza Hediye', description: 'Büyük boy pizza', color: VIBRANT_COLORS[8], icon: 'Pizza', probability: 4, stockQuantity: 50, remainingStock: 50, isActive: true, displayOrder: 8 },
    { id: '10', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[9], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 9 },
    { id: '11', name: 'Watch SE', description: 'Apple Watch SE', color: VIBRANT_COLORS[10], icon: 'Trophy', probability: 2, stockQuantity: 3, remainingStock: 3, isActive: true, displayOrder: 10 },
    { id: '12', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[11], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 11 },
    { id: '13', name: 'Sinema Bileti', description: '2 kişilik sinema bileti', color: VIBRANT_COLORS[12], icon: 'Ticket', probability: 4, stockQuantity: 30, remainingStock: 30, isActive: true, displayOrder: 12 },
    { id: '14', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[13], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 13 },
    { id: '15', name: 'MacBook Air', description: 'MacBook Air M3', color: VIBRANT_COLORS[14], icon: 'Crown', probability: 1, stockQuantity: 1, remainingStock: 1, isActive: true, displayOrder: 14 },
    { id: '16', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[15], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 15 },
    { id: '17', name: 'Kulaklık', description: 'Bluetooth kulaklık', color: VIBRANT_COLORS[16], icon: 'Gem', probability: 3, stockQuantity: 20, remainingStock: 20, isActive: true, displayOrder: 16 },
    { id: '18', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[17], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 17 },
    { id: '19', name: 'T-Shirt', description: 'Limited edition t-shirt', color: VIBRANT_COLORS[18], icon: 'Star', probability: 4, stockQuantity: 40, remainingStock: 40, isActive: true, displayOrder: 18 },
    { id: '20', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[19], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 19 },
    { id: '21', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[20], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 20 },
    { id: '22', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[21], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 21 },
    { id: '23', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[22], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 22 },
    { id: '24', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[23], icon: 'Heart', probability: 4, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 23 },
]

// Helper to generate a random code
function generateCode(length = 6): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed I, O, 0, 1
    let result = ''
    const bytes = randomBytes(length)
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length]
    }
    return result
}

// Helper to ensure default event exists
// Helper to ensure an event has default prizes if none exist
async function ensureEventPrizes(eventId: string) {
    if (!eventId) return

    // Special case for default event creation
    if (eventId === 'default') {
        const event = await db.events.findUnique({ where: { id: 'default' } })
        if (!event) {
            await db.events.create({
                data: {
                    id: 'default',
                    name: 'Demo Çark Etkinliği',
                    updated_at: new Date(),
                    status: 'published',
                    event_type: 'wheel',
                    access_type: 'public'
                }
            })
        }
    }

    // Check if prizes exist, seed if not
    const prizeCount = await db.wheelPrize.count({ where: { eventId: eventId } })
    if (prizeCount === 0) {
        await db.wheelPrize.createMany({
            data: DEFAULT_PRIZES.map(p => ({
                id: randomUUID(), // Ensure unique ID for each seed
                eventId: eventId,
                name: p.name,
                description: p.description,
                color: p.color,
                icon: p.icon,
                probability: p.probability,
                stockQuantity: p.stockQuantity,
                remainingStock: p.remainingStock,
                isActive: p.isActive,
                displayOrder: p.displayOrder
            }))
        })
    }
}

export async function toggleAccessCodes(eventId: string | undefined, enable: boolean) {
    if (!eventId) throw new Error("Event ID is required")

    await ensureEventPrizes(eventId)

    // Check if settings exist, create if not
    const settings = await db.wheelSetting.findUnique({
        where: { eventId: eventId },
    })

    if (!settings) {
        await db.wheelSetting.create({
            data: {
                eventId: eventId,
                enableAccessCodes: enable,
            },
        })
    } else {
        await db.wheelSetting.update({
            where: { eventId: eventId },
            data: { enableAccessCodes: enable },
        })
    }

    revalidatePath(`/events/new/wheeloffortune`)
    return { success: true }
}

export async function generateAccessCodes(eventId: string | undefined, count: number, createdBy?: string) {
    if (!eventId) throw new Error("Event ID is required")
    if (count < 1 || count > 1000) throw new Error("Count must be between 1 and 1000")

    await ensureEventPrizes(eventId)

    const codes = []
    for (let i = 0; i < count; i++) {
        codes.push({
            eventId: eventId,
            code: generateCode(),
            createdBy: createdBy,
        })
    }

    // Prisma createMany is supported in Postgres
    await db.wheelAccessCode.createMany({
        data: codes,
        skipDuplicates: true, // Just in case of collision
    })

    revalidatePath(`/events/new/wheeloffortune`)
    return { success: true, count: codes.length }
}

export async function getAccessCodes(eventId: string | undefined) {
    if (!eventId) return []

    const codes = await db.wheelAccessCode.findMany({
        where: { eventId: eventId },
        orderBy: { createdAt: 'desc' },
    })

    // Get prizes for used codes
    const spins = await db.wheelSpin.findMany({
        where: {
            eventId: eventId,
            claimCode: { in: codes.filter(c => c.isUsed).map(c => c.code) }
        },
        include: { wheelPrize: true }
    })

    return codes.map(code => {
        const spin = spins.find(s => s.claimCode === code.code)
        return {
            ...code,
            prize_name: spin?.wheelPrize?.name || null
        }
    })
}

export async function deleteAccessCode(codeId: string) {
    await db.wheelAccessCode.delete({
        where: { id: codeId },
    })

    revalidatePath(`/events/new/wheeloffortune`)
    return { success: true }
}

export async function verifyAccessCode(eventId: string | undefined, code: string) {
    if (!eventId) return { success: false, message: "Etkinlik bulunamadı." }

    // Master Bypass Code
    if (code.toUpperCase() === 'KS2026') {
        return { success: true, codeId: 'MASTER_BYPASS' }
    }

    const accessCode = await db.wheelAccessCode.findFirst({
        where: {
            eventId: eventId,
            code: { equals: code, mode: 'insensitive' }, // Case insensitive
        },
    })

    if (!accessCode) {
        return { success: false, message: "Geçersiz kod." }
    }

    if (accessCode.isUsed) {
        return { success: false, message: "Bu kod daha önce kullanılmış." }
    }

    return { success: true, codeId: accessCode.id }
}

export async function markAccessCodeAsUsed(codeId: string) {
    if (codeId === 'MASTER_BYPASS') return { success: true }

    await db.wheelAccessCode.update({
        where: { id: codeId },
        data: {
            isUsed: true,
            usedAt: new Date(),
        },
    })
    return { success: true }
}

export async function spinWheel(eventId: string, code?: string | null, participantName?: string) {
    if (!eventId) return { success: false, message: "Eksik bilgi." }

    await ensureEventPrizes(eventId)

    // 1. Verify Code if provided
    let accessCode = null
    if (code) {
        // Master Bypass
        if (code.toUpperCase() === 'KS2026') {
            accessCode = { id: 'MASTER_BYPASS', code: 'KS2026' }
        } else {
            accessCode = await db.wheelAccessCode.findFirst({
                where: {
                    eventId: eventId,
                    code: { equals: code, mode: 'insensitive' },
                    isUsed: false
                }
            })
        }

        if (!accessCode) {
            return { success: false, message: "Geçersiz veya kullanılmış kod." }
        }
    }

    // 2. Get Available Prizes
    const prizes = await db.wheelPrize.findMany({
        where: {
            eventId: eventId,
            isActive: true,
            remainingStock: { not: 0 } // Allow both positive (stock) and negative (unlimited)
        }
    })

    if (prizes.length === 0) {
        return { success: false, message: "Aktif hediye bulunamadı." }
    }

    // 3. Select Winner (Weighted Random)
    const totalProbability = prizes.reduce((sum: number, p: any) => sum + Number(p.probability), 0)
    let random = Math.random() * totalProbability
    let winner = prizes[0] as any

    for (const prize of prizes) {
        random -= Number(prize.probability)
        if (random <= 0) {
            winner = prize
            break
        }
    }

    // 4. Update DB (Transaction)
    try {
        // Generate unique tracking code (master bypass gets unique ID each time)
        const trackingCode = (accessCode && accessCode.id === 'MASTER_BYPASS')
            ? `ADMIN-${generateCode(10)}`
            : (accessCode ? accessCode.code : `ANON-${generateCode(10)}`)

        await db.$transaction(async (tx: any) => {
            // Mark code as used if verified (skip for master bypass)
            if (accessCode && accessCode.id !== 'MASTER_BYPASS') {
                await tx.wheelAccessCode.update({
                    where: { id: accessCode.id },
                    data: {
                        isUsed: true,
                        usedAt: new Date(),
                        participantName: participantName || null // Save name
                    }
                })
            }

            // Decrease stock if not unlimited
            if (winner.remainingStock !== -1) {
                await tx.wheelPrize.update({
                    where: { id: winner.id },
                    data: {
                        remainingStock: { decrement: 1 }
                    }
                })
            }

            // Record Spin
            await tx.wheelSpin.create({
                data: {
                    eventId: eventId,
                    prizeId: winner.id,
                    claimCode: trackingCode,
                    participantName: participantName || null,
                    isClaimed: true,
                    claimedAt: new Date()
                }
            })
        })

        revalidatePath(`/presentation/wheeloffortune/${eventId}`)

        // Return only necessary fields
        return {
            success: true,
            winner: {
                id: winner.id,
                name: winner.name,
                description: winner.description,
                color: winner.color,
                icon: winner.icon,
            }
        }

    } catch (error) {
        console.error("Spin transaction error:", error)
        return { success: false, message: "İşlem sırasında bir hata oluştu." }
    }
}

export async function registerForWheel(eventId: string, data: { name: string, email?: string, phone?: string, identityNumber?: string }) {
    if (!eventId || !data.name) return { success: false, message: "İsim zorunludur." }

    await ensureEventPrizes(eventId)

    // Validate Identity Number (TC)
    if (data.identityNumber) {
        if (!/^\d{11}$/.test(data.identityNumber)) {
            return { success: false, message: "Geçersiz TC Kimlik No (11 hane olmalı)." }
        }

        const existingTC = await db.wheelAccessCode.findFirst({
            where: {
                eventId: eventId,
                participantIdentityNumber: data.identityNumber
            }
        })
        if (existingTC) {
            return { success: false, message: "Bu TC Kimlik No ile zaten kayıt mevcut." }
        }
    }

    // Check if phone number is already registered
    if (data.phone) {
        const existingPhone = await db.wheelAccessCode.findFirst({
            where: {
                eventId: eventId,
                participantPhone: data.phone
            }
        })
        if (existingPhone) {
            return { success: false, message: "Bu telefon numarası ile zaten kayıt mevcut." }
        }
    }

    // Check if security is enabled (optional validation)
    const settings = await db.wheelSetting.findUnique({ where: { eventId: eventId } })

    // Generate Unique Code
    let code = generateCode()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
        const existing = await db.wheelAccessCode.findFirst({
            where: { eventId: eventId, code }
        })
        if (!existing) isUnique = true
        else {
            code = generateCode()
            attempts++
        }
    }

    if (!isUnique) return { success: false, message: "Kod üretilemedi, lütfen tekrar deneyin." }

    // Create Code with Participant Info
    const newCode = await db.wheelAccessCode.create({
        data: {
            eventId: eventId,
            code,
            isUsed: false,
            participantName: data.name,
            participantPhone: data.phone,
            participantEmail: data.email,
            participantIdentityNumber: data.identityNumber
        }
    })

    revalidatePath(`/events/new/wheeloffortune`)
    return { success: true, code: newCode.code }
}

export async function getWheelData(eventId: string) {
    if (!eventId) return null
    await ensureEventPrizes(eventId)

    const settings = await db.wheelSetting.findUnique({ where: { eventId } })
    const event = await db.events.findUnique({
        where: { id: eventId },
        select: { qr_code_url: true, join_url: true, event_pin: true }
    })

    const prizes = await db.wheelPrize.findMany({
        where: { eventId },
        orderBy: { displayOrder: 'asc' }
    })

    // Merge event-level info into settings for convenience
    const mergedSettings = settings ? {
        ...settings,
        qrCodeUrl: event?.qr_code_url,
        joinUrl: event?.join_url,
        eventPin: event?.event_pin
    } : null

    return { settings: mergedSettings, prizes }
}

export async function saveWheelData(eventId: string, data: { settings: any, prizes: any[] }) {
    if (!eventId) return { success: false, message: "Event ID required" }

    // Update Settings
    if (data.settings) {
        await db.wheelSetting.upsert({
            where: { eventId },
            update: {
                ...data.settings,
                updatedAt: new Date()
            },
            create: {
                eventId,
                ...data.settings
            }
        })
    }

    // Update Prizes
    if (data.prizes && data.prizes.length > 0) {
        // Update prizes if a non-empty list is provided.
        // If an empty list is provided, we skip (to avoid accidental wipes from settings updates).
        // If the user actually wants to delete all prizes, the UI should probably send a specific flag or we should handle it differently.
        // For now, [] means "skip" to match CreateEventModal usage.

        // 1. Get existing IDs
        const existingPrizes = await db.wheelPrize.findMany({ where: { eventId }, select: { id: true } })
        const existingIds = existingPrizes.map(p => p.id)
        const newIds = data.prizes.map(p => p.id)

        // 2. Delete removed prizes
        const toDelete = existingIds.filter(id => !newIds.includes(id))
        if (toDelete.length > 0) {
            // Check if used in spins? If cascade delete is on, spinning history lost?
            // Schema has `onDelete: Cascade` on Event, but WheelSpin -> WheelPrize?
            // `wheelPrize WheelPrize? @relation(...)`.
            // If I delete Prize, Spin.prizeId becomes null? Or restricted?
            // Let's assume soft delete or just delete for now. 
            // Better: Mark as isActive: false instead of delete if used?
            // For now, delete.
            await db.wheelPrize.deleteMany({ where: { id: { in: toDelete } } })
        }

        // 3. Upsert
        for (const p of data.prizes) {
            await db.wheelPrize.upsert({
                where: { id: p.id },
                update: {
                    name: p.name,
                    description: p.description,
                    color: p.color,
                    icon: p.icon,
                    probability: p.probability,
                    stockQuantity: p.stockQuantity,
                    remainingStock: p.remainingStock,
                    isActive: p.isActive,
                    displayOrder: p.displayOrder,
                    updatedAt: new Date()
                },
                create: {
                    id: p.id,
                    eventId,
                    name: p.name,
                    description: p.description,
                    color: p.color,
                    icon: p.icon,
                    probability: p.probability,
                    stockQuantity: p.stockQuantity,
                    remainingStock: p.remainingStock,
                    isActive: p.isActive,
                    displayOrder: p.displayOrder
                }
            })
        }
    }

    revalidatePath(`/presentation/wheeloffortune/${eventId}`)
    return { success: true }
}

// End Event and Generate Report
export async function endEventAndGenerateReport(eventId: string) {
    if (!eventId) return { success: false, message: "Etkinlik ID gerekli." }

    try {
        // Get event details
        const event = await db.events.findUnique({
            where: { id: eventId },
            select: { id: true, name: true, created_at: true }
        })

        if (!event) {
            return { success: false, message: "Etkinlik bulunamadı." }
        }

        // Get all spins with participant info
        const spins = await db.wheelSpin.findMany({
            where: { eventId },
            include: { wheelPrize: true },
            orderBy: { createdAt: 'asc' }
        })

        // Get ALL access codes (not just used ones)
        const accessCodes = await db.wheelAccessCode.findMany({
            where: { eventId },
            orderBy: { createdAt: 'asc' }
        })

        // Build participant report - ALL codes
        const participants = accessCodes.map(code => {
            const spin = spins.find(s => s.claimCode === code.code)
            return {
                code: code.code,
                name: code.participantName || '-',
                phone: code.participantPhone || '-',
                email: code.participantEmail || '-',
                prize: spin?.wheelPrize?.name || (code.isUsed ? 'Belirsiz' : 'Henüz katılmadı'),
                isWinner: spin?.wheelPrize?.name && !spin?.wheelPrize?.name.toLowerCase().includes('kazanamadı'),
                isUsed: code.isUsed,
                spinDate: spin?.createdAt || null
            }
        })

        // Statistics
        const totalCodes = participants.length
        const usedCodes = participants.filter(p => p.isUsed).length
        const totalWinners = participants.filter(p => p.isWinner).length
        const totalLosers = participants.filter(p => !p.isWinner && p.isUsed && p.prize !== 'Henüz katılmadı' && p.prize !== 'Belirsiz').length

        // Prize distribution
        const prizeStats: Record<string, number> = {}
        spins.forEach(spin => {
            const prizeName = spin.wheelPrize?.name || 'Bilinmiyor'
            prizeStats[prizeName] = (prizeStats[prizeName] || 0) + 1
        })

        // Create report data
        const reportData = {
            eventName: event.name,
            eventDate: event.created_at,
            generatedAt: new Date(),
            summary: {
                totalCodes,
                usedCodes,
                unusedCodes: totalCodes - usedCodes,
                totalWinners,
                totalLosers,
                totalSpins: spins.length
            },
            prizeDistribution: prizeStats,
            participants
        }

        // Save report to database
        const reportId = randomUUID()
        await db.report.create({
            data: {
                id: reportId,
                eventId: eventId,
                type: 'wheel_fortune_final',
                format: 'json',
                data: reportData as any,
                generatedAt: new Date()
            }
        })

        revalidatePath(`/events/new/wheeloffortune`)
        revalidatePath(`/dashboard/reports`)

        return {
            success: true,
            reportId,
            report: reportData
        }
    } catch (error) {
        console.error("Report generation error:", error)
        return { success: false, message: "Rapor oluşturulurken hata oluştu." }
    }
}

// Get all reports
export async function getReports() {
    try {
        const reports = await db.report.findMany({
            include: { event: { select: { name: true } } },
            orderBy: { generatedAt: 'desc' }
        })
        return reports
    } catch (error) {
        console.error("Get reports error:", error)
        return []
    }
}

// Get single report by ID
export async function getReportById(reportId: string) {
    try {
        const report = await db.report.findUnique({
            where: { id: reportId },
            include: { event: { select: { name: true } } }
        })
        return report
    } catch (error) {
        console.error("Get report error:", error)
        return null
    }
}
