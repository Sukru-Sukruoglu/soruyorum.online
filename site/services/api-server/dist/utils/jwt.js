"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractOrganizationId = exports.verifyToken = exports.generateShortLivedToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn });
};
exports.generateToken = generateToken;
const generateShortLivedToken = (payload, expiresIn) => {
    return (0, exports.generateToken)(payload, expiresIn);
};
exports.generateShortLivedToken = generateShortLivedToken;
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        throw new Error('Geçersiz veya süresi dolmuş token');
    }
};
exports.verifyToken = verifyToken;
const extractOrganizationId = (token) => {
    const decoded = (0, exports.verifyToken)(token);
    return decoded.organizationId;
};
exports.extractOrganizationId = extractOrganizationId;
