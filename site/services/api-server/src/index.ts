import "./polyfill";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import { createContext } from "./trpc";

// New Routes
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import participantRoutes from './routes/participants';
import settingsRoutes from './routes/settings';
import reportsRoutes from './routes/reports';
import { orgRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    "/trpc",
    createExpressMiddleware({
        router: appRouter,
        createContext,
    })
);

// Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', orgRateLimiter, eventRoutes);
app.use('/api/public', participantRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', orgRateLimiter, reportsRoutes);

app.get("/health", (req, res) => {
    res.send("OK");
});

app.use(errorHandler);

app.listen(port, () => {
    console.log(`API Server listening on port ${port}`);
});
