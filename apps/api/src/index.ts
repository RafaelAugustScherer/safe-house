import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { GAME, BOARD } from "@safehouse/shared";

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, boardRows: Object.keys(BOARD).length, statuses: GAME.GAME_STATUS });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN },
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    // Step 2 will wire room cleanup + offline marking here.
  });
});

httpServer.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
});
