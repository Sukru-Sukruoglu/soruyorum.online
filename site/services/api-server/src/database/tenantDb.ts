import { prisma, PrismaClient } from '@ks-interaktif/database';
// import { PrismaClient } from '@prisma/client'; // Removed

// Map singular model names to plural (Prisma convention)
const modelNameMap: Record<string, string> = {
    'event': 'events',
    'user': 'users',
    'organization': 'organizations',
    'participant': 'participants',
    'activity': 'activities',
    'question': 'questions',
    'session': 'sessions',
};

class TenantAwareDatabase {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    private getModelName(model: string): string {
        return modelNameMap[model] || model;
    }

    private validateOrganizationId(organizationId: string | undefined): asserts organizationId is string {
        if (!organizationId || typeof organizationId !== 'string') {
            throw new Error('GÜVENLİK İHLALİ: organizationId gerekli ve string olmalı');
        }
    }

    async findMany<T>(model: string, organizationId: string, query: any = {}): Promise<T[]> {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return (this.prisma as any)[modelName].findMany({
            ...query,
            where: { ...query.where, organization_id: organizationId },
        });
    }

    async findUnique<T>(model: string, organizationId: string, query: any): Promise<T | null> {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return (this.prisma as any)[modelName].findFirst({
            ...query,
            where: { ...query.where, organization_id: organizationId },
        });
    }

    async findFirst<T>(model: string, organizationId: string, query: any = {}): Promise<T | null> {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return (this.prisma as any)[modelName].findFirst({
            ...query,
            where: { ...query.where, organization_id: organizationId },
        });
    }

    async count(model: string, organizationId: string, query: any = {}): Promise<number> {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return (this.prisma as any)[modelName].count({
            ...query,
            where: { ...query.where, organization_id: organizationId },
        });
    }

    async create<T>(model: string, organizationId: string, data: any): Promise<T> {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return (this.prisma as any)[modelName].create({
            data: { ...data, organization_id: organizationId },
        });
    }

    async createMany(model: string, organizationId: string, data: any[]): Promise<{ count: number }> {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        const dataWithOrgId = data.map(item => ({ ...item, organization_id: organizationId }));
        return (this.prisma as any)[modelName].createMany({ data: dataWithOrgId });
    }

    async update<T>(model: string, organizationId: string, where: any, data: any): Promise<T> {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);

        const existing = await (this.prisma as any)[modelName].findFirst({
            where: { ...where, organization_id: organizationId },
        });

        if (!existing) {
            throw new Error('GÜVENLİK İHLALİ: Kayıt bulunamadı veya erişim reddedildi');
        }

        return (this.prisma as any)[modelName].update({
            where: { id: existing.id },
            data,
        });
    }

    async updateMany(model: string, organizationId: string, where: any, data: any): Promise<{ count: number }> {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return (this.prisma as any)[modelName].updateMany({
            where: { ...where, organization_id: organizationId },
            data,
        });
    }

    async delete<T>(model: string, organizationId: string, where: any): Promise<T> {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);

        const existing = await (this.prisma as any)[modelName].findFirst({
            where: { ...where, organization_id: organizationId },
        });

        if (!existing) {
            throw new Error('GÜVENLİK İHLALİ: Kayıt bulunamadı veya erişim reddedildi');
        }

        return (this.prisma as any)[modelName].delete({
            where: { id: existing.id },
        });
    }

    async deleteMany(model: string, organizationId: string, where: any): Promise<{ count: number }> {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return (this.prisma as any)[modelName].deleteMany({
            where: { ...where, organization_id: organizationId },
        });
    }

    async transaction(callback: (tx: any) => Promise<any>) {
        return this.prisma.$transaction(callback);
    }

    get direct() {
        return this.prisma;
    }
}

export const tenantDb = new TenantAwareDatabase();
