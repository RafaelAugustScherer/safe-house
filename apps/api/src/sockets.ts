import type { Server, Socket } from "socket.io";
import {
  createRoom,
  joinRoom,
  exitRoom,
  listRooms,
  startGame,
  rollInitial,
  rollNormal,
  playerMove,
  markUserOffline,
  scheduleRoomCleanup,
  tick,
  EngineError,
} from "./engine";
import { buildSnapshot } from "./snapshot";

declare module "socket.io" {
  interface SocketData {
    userId?: string;
    roomId?: string;
  }
}

type Ack<T = unknown> = (payload: { ok: true; data: T } | { ok: false; error: string }) => void;

const safe = async <T>(fn: () => Promise<T>, ack?: Ack<T>) => {
  try {
    const data = await fn();
    ack?.({ ok: true, data });
  } catch (e) {
    const err =
      e instanceof EngineError ? e.code : e instanceof Error ? e.message : "UNKNOWN";
    ack?.({ ok: false, error: err });
  }
};

const broadcast = async (io: Server, roomId: string) => {
  await tick(roomId);
  const snap = await buildSnapshot(roomId);
  if (snap) {
    io.to(`room:${roomId}`).emit("snapshot", snap);
    if (snap.status === "FINISHED") scheduleRoomCleanup(roomId);
  } else {
    io.to(`room:${roomId}`).emit("room:deleted", { roomId });
  }
};

export function registerHandlers(io: Server, socket: Socket): void {
  socket.on(
    "room:create",
    (
      input: { name: string; maxUsers: number; ownerUserId: string; ownerUsername: string },
      ack: Ack<{ roomId: string }>,
    ) =>
      safe(async () => {
        const roomId = await createRoom(input);
        socket.data.userId = input.ownerUserId;
        socket.data.roomId = roomId;
        await socket.join(`room:${roomId}`);
        await broadcast(io, roomId);
        return { roomId };
      }, ack),
  );

  socket.on(
    "room:join",
    (
      input: { roomId: string; userId: string; username: string },
      ack: Ack<{ ok: true }>,
    ) =>
      safe(async () => {
        await joinRoom(input.roomId, input.userId, input.username);
        socket.data.userId = input.userId;
        socket.data.roomId = input.roomId;
        await socket.join(`room:${input.roomId}`);
        await broadcast(io, input.roomId);
        return { ok: true as const };
      }, ack),
  );

  socket.on(
    "room:subscribe",
    (input: { roomId: string; userId?: string }, ack: Ack<{ subscribed: true }>) =>
      safe(async () => {
        socket.data.roomId = input.roomId;
        if (input.userId) socket.data.userId = input.userId;
        await socket.join(`room:${input.roomId}`);
        const snap = await buildSnapshot(input.roomId);
        if (snap) socket.emit("snapshot", snap);
        return { subscribed: true as const };
      }, ack),
  );

  socket.on("room:exit", (input: { roomId: string; userId: string }, ack: Ack<{ ok: true }>) =>
    safe(async () => {
      await exitRoom(input.roomId, input.userId);
      await socket.leave(`room:${input.roomId}`);
      await broadcast(io, input.roomId);
      return { ok: true as const };
    }, ack),
  );

  socket.on("room:list", (_: unknown, ack: Ack<unknown[]>) =>
    safe(async () => listRooms(), ack),
  );

  socket.on("game:start", (input: { roomId: string }, ack: Ack<{ ok: true }>) =>
    safe(async () => {
      await startGame(input.roomId);
      await broadcast(io, input.roomId);
      return { ok: true as const };
    }, ack),
  );

  socket.on(
    "roll:initial",
    (
      input: { roomId: string; userId: string; value: number },
      ack: Ack<{ ok: true }>,
    ) =>
      safe(async () => {
        await rollInitial(input.roomId, input.userId, input.value);
        await broadcast(io, input.roomId);
        return { ok: true as const };
      }, ack),
  );

  socket.on(
    "roll:normal",
    (
      input: { roomId: string; userId: string; diceA: number; diceB: number },
      ack: Ack<{ ok: true }>,
    ) =>
      safe(async () => {
        await rollNormal(input.roomId, input.userId, input.diceA, input.diceB);
        await broadcast(io, input.roomId);
        return { ok: true as const };
      }, ack),
  );

  socket.on(
    "move",
    (
      input: { roomId: string; userId: string; cell: string },
      ack: Ack<{ won: boolean }>,
    ) =>
      safe(async () => {
        const result = await playerMove(input.roomId, input.userId, input.cell);
        await broadcast(io, input.roomId);
        return result;
      }, ack),
  );

  socket.on("disconnect", async () => {
    const { roomId, userId } = socket.data;
    if (roomId && userId) {
      await markUserOffline(roomId, userId);
      await broadcast(io, roomId);
    }
  });
}
