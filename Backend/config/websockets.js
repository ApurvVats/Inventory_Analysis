import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

let io;

export function initializeWebsockets(httpServer, allowedOrigins) {
    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins, // Use the same list of origins from your main server.js
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
            io.adapter(createAdapter(pubClient, subClient));
            console.log("[Socket.IO] Connected to Redis adapter.");
        })
        .catch((err) => {
            console.error("[Socket.IO] Failed to connect to Redis adapter:", err);
        });

    io.on("connection", (socket) => {
        console.log(`[Socket.IO] A user connected: ${socket.id}`);
        socket.on("disconnect", () => {
            console.log(`[Socket.IO] User disconnected: ${socket.id}`);
        });
    });

    console.log("[Socket.IO] Server initialized.");
    return io;
}

export function getIO() {
    if (!io) {
        throw new Error("Socket.IO not initialized! The server may have failed to start correctly.");
    }
    return io;
}