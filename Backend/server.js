import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from 'http';
import cors from "cors";
dotenv.config();
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js";
import inventoryRoutes from "./routes/inventory.js";
import salesRoutes from './routes/sales.js';
import marketingRoutes from './routes/marketing.js';
import { initializeWebsockets, getIO } from './config/websockets.js';
// Ensure the worker starts listening for jobs when the server starts
// import './workers/demandAnalysisWorker.js';
import demandRoutes from './routes/demand.js'; // NEW: The only route for demand analysis
const app = express();
const httpServer = http.createServer(app);
// --- CORS Configuration (Single Source of Truth) ---
const allowedOrigins = [
    'http://localhost:5173', 
    'https://witty-pond-0c0668400.2.azurestaticapps.net',
    process.env.CLIENT_URL // Good practice to include this from .env
].filter(Boolean); // Filters out any undefined/null values
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
// --- WebSocket Server Initialization (Done ONCE) ---
initializeWebsockets(httpServer, allowedOrigins);
// --- Global Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    req.io = getIO();
    next();
});
// --- API Routes ---
app.get("/", (_req, res) => res.json({ status: "ok", message: "Server is healthy" }));
app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/sales", salesRoutes);
app.use("/marketing", marketingRoutes);
app.use("/demand", demandRoutes);
// --- Start Server ---
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`[Server] HTTP and WebSocket server running on port ${PORT}`);
});