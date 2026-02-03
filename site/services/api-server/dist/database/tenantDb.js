"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantDb = void 0;
const database_1 = require("@ks-interaktif/database");
// import { PrismaClient } from '@prisma/client'; // Removed
// Map singular model names to plural (Prisma convention)
const modelNameMap = {
    'event': 'events',
    'user': 'users',
    'organization': 'organizations',
    'participant': 'participants',
    'activity': 'activities',
    'question': 'questions',
    'session': 'sessions',
};
class TenantAwareDatabase {
    prisma;
    constructor() {
        this.prisma = database_1.prisma;
    }
    getModelName(model) {
        return modelNameMap[model] || model;
    }
    validateOrganizationId(organizationId) {
        if (!organizationId || typeof organizationId !== 'string') {
            throw new Error('GÜVENLİK İHLALİ: organizationId gerekli ve string olmalı');
        }
    }
    async findMany(model, organizationId, query = {}) {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return this.prisma[modelName].findMany({
            ...query,
            where: { ...query.where, organization_id: organizationId },
        });
    }
    async findUnique(model, organizationId, query) {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return this.prisma[modelName].findFirst({
            ...query,
            where: { ...query.where, organization_id: organizationId },
        });
    }
    async findFirst(model, organizationId, query = {}) {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return this.prisma[modelName].findFirst({
            ...query,
            where: { ...query.where, organization_id: organizationId },
        });
    }
    async count(model, organizationId, query = {}) {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return this.prisma[modelName].count({
            ...query,
            where: { ...query.where, organization_id: organizationId },
        });
    }
    async create(model, organizationId, data) {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return this.prisma[modelName].create({
            data: { ...data, organization_id: organizationId },
        });
    }
    async createMany(model, organizationId, data) {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        const dataWithOrgId = data.map(item => ({ ...item, organization_id: organizationId }));
        return this.prisma[modelName].createMany({ data: dataWithOrgId });
    }
    async update(model, organizationId, where, data) {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        const existing = await this.prisma[modelName].findFirst({
            where: { ...where, organization_id: organizationId },
        });
        if (!existing) {
            throw new Error('GÜVENLİK İHLALİ: Kayıt bulunamadı veya erişim reddedildi');
        }
        return this.prisma[modelName].update({
            where: { id: existing.id },
            data,
        });
    }
    async updateMany(model, organizationId, where, data) {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return this.prisma[modelName].updateMany({
            where: { ...where, organization_id: organizationId },
            data,
        });
    }
    async delete(model, organizationId, where) {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        const existing = await this.prisma[modelName].findFirst({
            where: { ...where, organization_id: organizationId },
        });
        if (!existing) {
            throw new Error('GÜVENLİK İHLALİ: Kayıt bulunamadı veya erişim reddedildi');
        }
        return this.prisma[modelName].delete({
            where: { id: existing.id },
        });
    }
    async deleteMany(model, organizationId, where) {
        this.validateOrganizationId(organizationId);
        const modelName = this.getModelName(model);
        return this.prisma[modelName].deleteMany({
            where: { ...where, organization_id: organizationId },
        });
    }
    async transaction(callback) {
        return this.prisma.$transaction(callback);
    }
    get direct() {
        return this.prisma;
    }
}
exports.tenantDb = new TenantAwareDatabase();
