import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { registerHandlers } from "./sockets";
import { prisma } from "./db";

export function createServer(corsOrigin = "http://localhost:3000") {
  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  app.get("/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true });
    } catch (e) {
      res.status(503).json({ ok: false, error: (e as Error).message });
    }
  });

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, { cors: { origin: corsOrigin } });
  io.on("connection", (socket) => registerHandlers(io, socket));

  return { app, httpServer, io };
}
