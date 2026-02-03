"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./polyfill");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_2 = require("@trpc/server/adapters/express");
const router_1 = require("./router");
const trpc_1 = require("./trpc");
// New Routes
const auth_1 = __importDefault(require("./routes/auth"));
const events_1 = __importDefault(require("./routes/events"));
const participants_1 = __importDefault(require("./routes/participants"));
const settings_1 = __importDefault(require("./routes/settings"));
const reports_1 = __importDefault(require("./routes/reports"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/trpc", (0, express_2.createExpressMiddleware)({
    router: router_1.appRouter,
    createContext: trpc_1.createContext,
}));
// Mount REST API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/events', rateLimiter_1.orgRateLimiter, events_1.default);
app.use('/api/public', participants_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/reports', rateLimiter_1.orgRateLimiter, reports_1.default);
app.get("/health", (req, res) => {
    res.send("OK");
});
app.use(errorHandler_1.errorHandler);
app.listen(port, () => {
    console.log(`API Server listening on port ${port}`);
});
