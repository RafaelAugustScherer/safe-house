import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import {
  GAME,
  ZOMBIES,
  TURN_STAGES,
  GAME_STATUS,
  TURN_USER,
  ACTIONS,
  SPAWN_ROW,
  BOARD,
  type BoardRow,
  type BoardCell,
} from "@safehouse/shared";
import { prisma } from "./db";

const SPAWN_CELLS: BoardCell[] = (BOARD[SPAWN_ROW] as readonly number[]).map(
  (c) => `${SPAWN_ROW}${c}` as BoardCell,
);

export class EngineError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const must = <T>(v: T | null | undefined, code: string, msg: string): T => {
  if (v === null || v === undefined) throw new EngineError(code, msg);
  return v;
};

// -------------------------- Room lifecycle --------------------------

export interface CreateRoomInput {
  name: string;
  maxUsers: number;
  ownerUserId: string;
  ownerUsername: string;
}

export async function createRoom(input: CreateRoomInput): Promise<string> {
  if (input.maxUsers < 2 || input.maxUsers > 5) {
    throw new EngineError(
      "INVALID_MAX_USERS",
      "maxUsers must be between 2 and 5",
    );
  }

  const roomId = randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.room.create({
      data: {
        id: roomId,
        name: input.name,
        ownerUserId: input.ownerUserId,
        maxUsers: input.maxUsers,
        status: "WAITING",
        users: {
          create: {
            userId: input.ownerUserId,
            username: input.ownerUsername,
            isOwner: true,
          },
        },
        zombies: {
          create: ZOMBIES.map((z) => ({
            zombieId: z.id,
            position: z.position,
            kind: z.kind === "horde" ? "HORDE" : "SINGLE",
          })),
        },
      },
    });
  });

  return roomId;
}

export async function joinRoom(
  roomId: string,
  userId: string,
  username: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const room = must(
      await tx.room.findUnique({
        where: { id: roomId },
        include: { users: true },
      }),
      "ROOM_NOT_FOUND",
      "Room not found",
    );

    if (room.status !== "WAITING") {
      throw new EngineError("ROOM_IN_PROGRESS", "Room already started");
    }
    if (room.users.length >= room.maxUsers) {
      throw new EngineError("ROOM_FULL", "Room is full");
    }

    await tx.roomUser.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId, username, online: true },
      update: { username, online: true },
    });
  });
}

export async function exitRoom(roomId: string, userId: string): Promise<{ deleted: boolean }> {
  return prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({ where: { id: roomId } });
    if (!room) return { deleted: false };

    // Owner exiting deletes the room (matches original Firebase semantics).
    if (room.ownerUserId === userId) {
      await tx.room.delete({ where: { id: roomId } });
      return { deleted: true };
    }
    await tx.roomUser
      .delete({ where: { roomId_userId: { roomId, userId } } })
      .catch(() => undefined);
    return { deleted: false };
  });
}

export async function markUserOffline(
  roomId: string,
  userId: string,
): Promise<void> {
  await prisma.roomUser
    .update({
      where: { roomId_userId: { roomId, userId } },
      data: { online: false },
    })
    .catch(() => undefined);
}

export async function listRooms() {
  const rooms = await prisma.room.findMany({
    where: { status: "WAITING" },
    include: { users: { select: { userId: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rooms.map((r) => ({
    id: r.id,
    name: r.name,
    maxUsers: r.maxUsers,
    currentUsers: r.users.length,
    ownerUserId: r.ownerUserId,
  }));
}

// -------------------------- Game flow --------------------------

export async function startGame(roomId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const room = must(
      await tx.room.findUnique({
        where: { id: roomId },
        include: { users: true },
      }),
      "ROOM_NOT_FOUND",
      "Room not found",
    );
    if (room.status !== "WAITING") {
      throw new EngineError("ALREADY_STARTED", "Room already started");
    }
    if (room.users.length < 2) {
      throw new EngineError("NEED_MORE_PLAYERS", "At least 2 players required");
    }

    await tx.room.update({
      where: { id: roomId },
      data: { status: "PLAYING" },
    });

    await tx.turn.upsert({
      where: { roomId },
      create: {
        roomId,
        currentUserId: TURN_USER.ALL_USERS,
        stage: TURN_STAGES.ROLL_INIT,
        availableMovements: 0,
        availableCells: [],
        turnNumber: 0,
      },
      update: {
        currentUserId: TURN_USER.ALL_USERS,
        stage: TURN_STAGES.ROLL_INIT,
        availableMovements: 0,
        availableCells: [],
        turnNumber: 0,
        diceA: null,
        diceB: null,
      },
    });
  });
}

export async function rollInitial(
  roomId: string,
  userId: string,
  rollValue: number,
): Promise<void> {
  if (rollValue < 1 || rollValue > 6) {
    throw new EngineError("INVALID_ROLL", "Roll must be 1-6");
  }
  await prisma.roomUser.update({
    where: { roomId_userId: { roomId, userId } },
    data: { initRollValue: rollValue },
  });
}

export async function rollNormal(
  roomId: string,
  userId: string,
  diceA: number,
  diceB: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const turn = must(
      await tx.turn.findUnique({ where: { roomId } }),
      "TURN_NOT_FOUND",
      "Turn not initialized",
    );
    if (turn.currentUserId !== userId) {
      throw new EngineError("NOT_YOUR_TURN", "Not your turn");
    }
    if (turn.stage !== TURN_STAGES.MOVE_ROLL) {
      throw new EngineError("WRONG_STAGE", `Cannot roll in stage ${turn.stage}`);
    }
    // Movement = |diceA - diceB|. Equal rolls → re-roll (movements = 0 stays in MOVE_ROLL).
    const movement = Math.abs(diceA - diceB);
    if (movement === 0) {
      await tx.turn.update({
        where: { roomId },
        data: { diceA, diceB }, // stay in MOVE_ROLL, client should re-roll
      });
      return;
    }
    await tx.turn.update({
      where: { roomId },
      data: {
        stage: TURN_STAGES.MOVE,
        availableMovements: movement,
        availableCells: [], // tick() will populate
        diceA,
        diceB,
      },
    });
  });
}

export async function playerMove(
  roomId: string,
  userId: string,
  cell: string,
): Promise<{ won: boolean }> {
  return prisma.$transaction(async (tx) => {
    const turn = must(
      await tx.turn.findUnique({ where: { roomId } }),
      "TURN_NOT_FOUND",
      "Turn not initialized",
    );
    if (turn.currentUserId !== userId) {
      throw new EngineError("NOT_YOUR_TURN", "Not your turn");
    }
    const allowed = (turn.availableCells as string[]) ?? [];
    if (!allowed.includes(cell) && cell !== ACTIONS.WIN) {
      throw new EngineError("ILLEGAL_MOVE", `Cell ${cell} not reachable`);
    }

    if (cell === ACTIONS.WIN) {
      await tx.room.update({
        where: { id: roomId },
        data: { status: "FINISHED" },
      });
      await tx.roomUser.update({
        where: { roomId_userId: { roomId, userId } },
        data: { points: { increment: 100 } }, // base reward; refined in Step 4.9
      });
      return { won: true };
    }

    await tx.roomUser.update({
      where: { roomId_userId: { roomId, userId } },
      data: { position: cell },
    });
    await tx.turn.update({
      where: { roomId },
      data: {
        availableMovements: { decrement: 1 },
        availableCells: [], // tick() will recompute
      },
    });
    return { won: false };
  });
}

// -------------------------- Rule engine tick --------------------------

// Runs after every mutation. Auto-advances any state that doesn't need a
// player input. Idempotent: safe to call multiple times in a row.
export async function tick(roomId: string): Promise<void> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { users: true, turn: true },
  });
  if (!room || !room.turn) return;
  const turn = room.turn;

  // 1. All initial rolls in → transition to card-deal stage.
  if (
    turn.stage === TURN_STAGES.ROLL_INIT &&
    room.users.length > 0 &&
    room.users.every((u) => u.initRollValue !== null)
  ) {
    await prisma.turn.update({
      where: { roomId },
      data: {
        currentUserId: TURN_USER.GAME,
        stage: TURN_STAGES.GET_INITIAL_CARDS,
      },
    });
    return tick(roomId);
  }

  // 2. Card-deal stage: assign turn order by initRollValue desc, transition
  // to MOVE_ROLL for first player. Step 4.1 will replace the empty deal
  // with real card distribution; for now we just sequence the players.
  if (turn.stage === TURN_STAGES.GET_INITIAL_CARDS) {
    const ordered = [...room.users]
      .sort((a, b) => (b.initRollValue ?? 0) - (a.initRollValue ?? 0));
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < ordered.length; i++) {
        await tx.roomUser.update({
          where: { roomId_userId: { roomId, userId: ordered[i].userId } },
          data: { turnOrder: i },
        });
      }
      await tx.turn.update({
        where: { roomId },
        data: {
          currentUserId: ordered[0].userId,
          stage: TURN_STAGES.MOVE_ROLL,
          availableMovements: 0,
          availableCells: [],
        },
      });
    });
    return tick(roomId);
  }

  // 3. In MOVE stage with movements remaining but no available cells →
  // populate available cells from current position (or spawn line).
  if (
    turn.stage === TURN_STAGES.MOVE &&
    turn.availableMovements > 0 &&
    ((turn.availableCells as string[]) ?? []).length === 0
  ) {
    const user = room.users.find((u) => u.userId === turn.currentUserId);
    if (!user) return;
    const cells = user.position
      ? cellsAroundPosition(user.position)
      : [...SPAWN_CELLS];
    await prisma.turn.update({
      where: { roomId },
      data: { availableCells: cells },
    });
    return;
  }

  // 4. MOVE stage with 0 movements left → cycle to next player.
  if (turn.stage === TURN_STAGES.MOVE && turn.availableMovements === 0) {
    const ordered = [...room.users]
      .filter((u) => u.turnOrder !== null)
      .sort((a, b) => (a.turnOrder ?? 0) - (b.turnOrder ?? 0));
    const idx = ordered.findIndex((u) => u.userId === turn.currentUserId);
    const next = ordered[(idx + 1) % ordered.length];
    await prisma.turn.update({
      where: { roomId },
      data: {
        currentUserId: next.userId,
        stage: TURN_STAGES.MOVE_ROLL,
        availableMovements: 0,
        availableCells: [],
        diceA: null,
        diceB: null,
        turnNumber: { increment: 1 },
      },
    });
    return;
  }
}

// Replicates `prepareAvaliableCells` from the original game.service.js:
// horizontal neighbors + cell on next row toward safe house. If on row 'a',
// next move is the WIN action.
export function cellsAroundPosition(position: string): string[] {
  const row = position[0] as BoardRow;
  const col = parseInt(position.slice(1), 10);
  const cells: string[] = [];
  if (col > 1) cells.push(`${row}${col - 1}`);
  if (col < 8) cells.push(`${row}${col + 1}`);

  const rows = Object.keys(BOARD) as BoardRow[];
  const rowIndex = rows.indexOf(row);
  const nextRow = rows[rowIndex - 1]; // one closer to 'a'
  if (nextRow) {
    cells.push(`${nextRow}${col}`);
  } else if (row === "a") {
    cells.push(ACTIONS.WIN);
  }
  return cells;
}

// Cleanup: when a room transitions to FINISHED, schedule deletion in 5s.
const cleanupTimers = new Map<string, NodeJS.Timeout>();
export function scheduleRoomCleanup(roomId: string): void {
  if (cleanupTimers.has(roomId)) return;
  const t = setTimeout(async () => {
    cleanupTimers.delete(roomId);
    await prisma.room.delete({ where: { id: roomId } }).catch(() => undefined);
  }, 5000);
  cleanupTimers.set(roomId, t);
}

export const __test_only = { cellsAroundPosition };
export { Prisma };
