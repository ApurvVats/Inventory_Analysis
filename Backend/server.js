import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js";
import inventoryRoutes from "./routes/inventory.js";
import salesRoutes from './routes/sales.js';
import marketingRoutes from './routes/marketing.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: "https://witty-pond-0c0668400.2.azurestaticapps.net", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads")); // Serve static files if needed

// API Routes
app.get("/", (_req, res) => res.json({ status: "ok", message: "Server is healthy" }));
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use('/api/marketing', marketingRoutes);

// Server Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));