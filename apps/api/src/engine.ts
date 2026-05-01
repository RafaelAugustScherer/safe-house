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
  CHEST_POSITIONS,
  TENT_POSITIONS,
  buildDecks,
  findCardByKey,
  cardSlotForType,
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
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  const decks = buildDecks(seed);

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
        decks: {
          create: [
            { deck: "RED", cards: decks.red, discard: [] },
            { deck: "GREEN", cards: decks.green, discard: [] },
            { deck: "BLUE", cards: decks.blue, discard: [] },
          ],
        },
        tiles: {
          create: [
            ...CHEST_POSITIONS.map((cell) => ({ cell, tileType: "CHEST" as const })),
            ...TENT_POSITIONS.map((cell) => ({ cell, tileType: "TENT" as const })),
          ],
        },
      },
    });
  });

  return roomId;
}

// Draw the top card of a deck and assign it to the user. If the deck is
// empty, reshuffle the discard pile back into it. Returns the drawn card key.
async function drawCard(
  tx: Prisma.TransactionClient,
  roomId: string,
  userId: string,
  deck: "RED" | "GREEN" | "BLUE",
): Promise<string | null> {
  const row = await tx.deck.findUnique({ where: { roomId_deck: { roomId, deck } } });
  if (!row) return null;
  let cards = row.cards as string[];
  let discard = row.discard as string[];
  if (cards.length === 0) {
    if (discard.length === 0) return null;
    // Reshuffle discard back into deck.
    const seed = (Date.now() & 0xffffffff) >>> 0;
    cards = (await import("@safehouse/shared")).shuffleDeck(discard, seed);
    discard = [];
  }
  const [drawn, ...rest] = cards;
  await tx.deck.update({
    where: { roomId_deck: { roomId, deck } },
    data: { cards: rest, discard },
  });
  const card = findCardByKey(drawn);
  if (!card) return null;
  const slot = cardSlotForType(card.type);
  await tx.playerCard.upsert({
    where: { roomId_userId_cardKey: { roomId, userId, cardKey: drawn } },
    create: { roomId, userId, cardKey: drawn, slot },
    update: {},
  });
  return drawn;
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
      await tx.roomUser.update({
        where: { roomId_userId: { roomId, userId } },
        data: { points: { increment: 100 } },
      });
      await tx.room.update({
        where: { id: roomId },
        data: { status: "FINISHED", winnerUserId: userId },
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

    // If the player landed on an unlooted chest/tent, suspend movement and
    // enter the loot stage. tick() will pick up MOVE again after resolution.
    const tile = await tx.boardTile.findUnique({
      where: { roomId_cell: { roomId, cell } },
    });
    if (tile && !tile.looted && tile.tileType !== "EMPTY") {
      await tx.turn.update({
        where: { roomId },
        data: {
          stage:
            tile.tileType === "CHEST"
              ? TURN_STAGES.OPEN_CHEST
              : TURN_STAGES.ENTER_TENT,
          availableCells: [cell],
        },
      });
      return { won: false };
    }

    // Otherwise, check for adjacent zombies/hordes and transition to FIGHT.
    const zombiesNearby = await zombiesAdjacentTo(tx, roomId, cell);
    if (zombiesNearby.length > 0) {
      const horde = zombiesNearby.find((z) => z.kind === "HORDE");
      await tx.turn.update({
        where: { roomId },
        data: {
          stage: horde ? TURN_STAGES.HORDE_FIGHT : TURN_STAGES.FIGHT,
          // Stash the threat zombieId in availableCells[0] so the resolution
          // step can find it without re-deriving from position.
          availableCells: [String(horde ? horde.zombieId : zombiesNearby[0].zombieId)],
        },
      });
    }

    return { won: false };
  });
}

// --- Sound penalty -----------------------------------------------------------
//
// Advance the nearest horde one cell toward the noisy player. Called after
// firearm attacks, failed loot rolls, and vehicle moves.
async function applySoundPenalty(
  tx: Prisma.TransactionClient,
  roomId: string,
  playerCell: string,
): Promise<void> {
  const hordes = await tx.zombie.findMany({
    where: { roomId, kind: "HORDE" },
  });
  if (hordes.length === 0) return;
  const [pRow, pCol] = parseCell(playerCell);
  const rows = Object.keys(BOARD) as BoardRow[];
  const pRowIdx = rows.indexOf(pRow);

  // Pick the closest horde (Manhattan distance).
  let nearest = hordes[0];
  let nearestDist = manhattan(pRowIdx, pCol, rows.indexOf(nearest.position[0] as BoardRow), parseInt(nearest.position.slice(1), 10));
  for (const h of hordes.slice(1)) {
    const d = manhattan(pRowIdx, pCol, rows.indexOf(h.position[0] as BoardRow), parseInt(h.position.slice(1), 10));
    if (d < nearestDist) {
      nearest = h;
      nearestDist = d;
    }
  }

  // Step one cell toward the player, axis-by-axis (greater delta first).
  const [hRow, hCol] = parseCell(nearest.position);
  const hRowIdx = rows.indexOf(hRow);
  const dr = pRowIdx - hRowIdx;
  const dc = pCol - hCol;
  let nextRowIdx = hRowIdx;
  let nextCol = hCol;
  if (Math.abs(dr) >= Math.abs(dc) && dr !== 0) {
    nextRowIdx = hRowIdx + Math.sign(dr);
  } else if (dc !== 0) {
    nextCol = hCol + Math.sign(dc);
  }
  const nextCell = `${rows[nextRowIdx]}${nextCol}`;
  await tx.zombie.update({
    where: { roomId_zombieId: { roomId, zombieId: nearest.zombieId } },
    data: { position: nextCell },
  });
}

const parseCell = (cell: string): [BoardRow, number] =>
  [cell[0] as BoardRow, parseInt(cell.slice(1), 10)] as [BoardRow, number];

const manhattan = (r1: number, c1: number, r2: number, c2: number) =>
  Math.abs(r1 - r2) + Math.abs(c1 - c2);

// Manhattan-adjacent (4-connected) zombies/hordes to a cell.
async function zombiesAdjacentTo(
  tx: Prisma.TransactionClient,
  roomId: string,
  cell: string,
) {
  const row = cell[0] as BoardRow;
  const col = parseInt(cell.slice(1), 10);
  const rows = Object.keys(BOARD) as BoardRow[];
  const rowIdx = rows.indexOf(row);
  const candidates: string[] = [];
  if (col > 1) candidates.push(`${row}${col - 1}`);
  if (col < 8) candidates.push(`${row}${col + 1}`);
  if (rowIdx > 0) candidates.push(`${rows[rowIdx - 1]}${col}`);
  if (rowIdx < rows.length - 1) candidates.push(`${rows[rowIdx + 1]}${col}`);
  return tx.zombie.findMany({
    where: { roomId, position: { in: candidates } },
  });
}

// --- Combat ------------------------------------------------------------------

export async function fightAttack(
  roomId: string,
  userId: string,
  weaponKey: string,
  rollValue: number,
): Promise<{ killed: boolean; infected: boolean; bonus: boolean; soundPenalty: boolean }> {
  if (rollValue < 1 || rollValue > 6) {
    throw new EngineError("INVALID_ROLL", "Roll must be 1-6");
  }
  return prisma.$transaction(async (tx) => {
    const turn = must(
      await tx.turn.findUnique({ where: { roomId } }),
      "TURN_NOT_FOUND",
      "Turn not initialized",
    );
    if (turn.currentUserId !== userId) {
      throw new EngineError("NOT_YOUR_TURN", "Not your turn");
    }
    const isFight = turn.stage === TURN_STAGES.FIGHT;
    const isHorde = turn.stage === TURN_STAGES.HORDE_FIGHT;
    if (!isFight && !isHorde) {
      throw new EngineError("WRONG_STAGE", `Cannot attack in stage ${turn.stage}`);
    }
    const weaponCard = findCardByKey(weaponKey);
    if (!weaponCard || !("normalValue" in weaponCard)) {
      throw new EngineError("INVALID_WEAPON", "Card is not a weapon");
    }
    const inHand = await tx.playerCard.findFirst({
      where: { roomId, userId, cardKey: weaponKey },
    });
    if (!inHand) throw new EngineError("WEAPON_NOT_IN_HAND", "You don't have that weapon");

    const isFirearm = weaponCard.cardAction === GAME.CARDS_ACTIONS.GUN_ATTACK;
    const success = rollValue >= weaponCard.normalValue;
    const bonus =
      success && weaponCard.specialValue > 0 && rollValue >= 6 - weaponCard.specialValue;

    const zombieId = parseInt((turn.availableCells as string[])[0] ?? "0", 10);
    const zombie = await tx.zombie.findUnique({
      where: { roomId_zombieId: { roomId, zombieId } },
    });

    let killed = false;
    let infected = false;
    if (success && zombie) {
      // Single zombies and hordes both die on a successful attack — hordes
      // require the bonus tier (`specialValue`) for now to keep the rules
      // simple; ordinary success against a horde just scares it off without
      // a kill (see Step 4.6 horde retreat).
      if (zombie.kind === "SINGLE" || bonus) {
        await tx.zombie.delete({
          where: { roomId_zombieId: { roomId, zombieId } },
        });
        killed = true;
        await tx.roomUser.update({
          where: { roomId_userId: { roomId, userId } },
          data: { points: { increment: bonus ? 20 : 10 } },
        });
      }
    } else if (!success && isFirearm) {
      // Failed firearm shot: infection. Cured if MEDICINE is consumed within
      // 2 turns (Step 4.8 enforces death otherwise).
      infected = true;
      await tx.roomUser.update({
        where: { roomId_userId: { roomId, userId } },
        data: { infectedUntilTurn: turn.turnNumber + 2 },
      });
    }

    // Return to MOVE stage with whatever movements remain.
    await tx.turn.update({
      where: { roomId },
      data: { stage: TURN_STAGES.MOVE, availableCells: [] },
    });

    const noisy = weaponCard.soundPenalty && (success || isFirearm);
    if (noisy) {
      const player = await tx.roomUser.findUnique({
        where: { roomId_userId: { roomId, userId } },
      });
      if (player?.position) await applySoundPenalty(tx, roomId, player.position);
    }

    return { killed, infected, bonus, soundPenalty: noisy };
  });
}

// --- Vehicles ---------------------------------------------------------------
//
// Solo: driver picks a destination within vehicle.value Manhattan cells of
// their current position. The vehicle is discarded back to the blue deck and
// a sound penalty is applied.
// Duo: when the vehicle's `duo` flag is true and an ally is adjacent, the
// engine first transitions to VEHICLE_INVITE and waits for the ally to
// accept/decline before moving.

// availableCells layout for vehicle stages:
//   [0] = vehicle card key
//   [1] = passenger userId (after accepted duo invite, or "" for solo)
//   [2] = invitee userId (only during VEHICLE_INVITE)

export async function useVehicle(
  roomId: string,
  userId: string,
  vehicleKey: string,
): Promise<{ inviting: string | null }> {
  return prisma.$transaction(async (tx) => {
    const turn = must(
      await tx.turn.findUnique({ where: { roomId } }),
      "TURN_NOT_FOUND",
      "Turn not initialized",
    );
    if (turn.currentUserId !== userId) {
      throw new EngineError("NOT_YOUR_TURN", "Not your turn");
    }
    // Vehicles can only start a journey from the ordinary movement stages.
    if (turn.stage !== TURN_STAGES.MOVE && turn.stage !== TURN_STAGES.MOVE_ROLL) {
      throw new EngineError("WRONG_STAGE", `Cannot use vehicle in stage ${turn.stage}`);
    }
    const card = findCardByKey(vehicleKey);
    if (!card || !("value" in card) || !("duo" in card)) {
      throw new EngineError("NOT_A_VEHICLE", "Card is not a vehicle");
    }
    const inHand = await tx.playerCard.findFirst({
      where: { roomId, userId, cardKey: vehicleKey },
    });
    if (!inHand) throw new EngineError("VEHICLE_NOT_IN_HAND", "Vehicle not in hand");

    if (card.duo) {
      // Look for an adjacent ally to invite.
      const driver = await tx.roomUser.findUnique({
        where: { roomId_userId: { roomId, userId } },
      });
      if (driver?.position) {
        const [dRow, dCol] = parseCell(driver.position);
        const rows = Object.keys(BOARD) as BoardRow[];
        const dRowIdx = rows.indexOf(dRow);
        const adj = [
          dCol > 1 ? `${dRow}${dCol - 1}` : null,
          dCol < 8 ? `${dRow}${dCol + 1}` : null,
          dRowIdx > 0 ? `${rows[dRowIdx - 1]}${dCol}` : null,
          dRowIdx < rows.length - 1 ? `${rows[dRowIdx + 1]}${dCol}` : null,
        ].filter((c): c is string => !!c);
        const allies = await tx.roomUser.findMany({
          where: { roomId, position: { in: adj }, userId: { not: userId } },
        });
        if (allies.length > 0) {
          const invitee = allies[0];
          await tx.turn.update({
            where: { roomId },
            data: {
              stage: TURN_STAGES.VEHICLE_INVITE,
              availableCells: [vehicleKey, "", invitee.userId],
            },
          });
          return { inviting: invitee.userId };
        }
      }
    }

    // Solo (or duo with no ally): straight to VEHICLE_MOVE.
    const driver2 = await tx.roomUser.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    const reach = driver2?.position
      ? reachableCells(driver2.position, card.value)
      : [];
    await tx.turn.update({
      where: { roomId },
      data: {
        stage: TURN_STAGES.VEHICLE_MOVE,
        availableCells: [vehicleKey, "", ...reach],
      },
    });
    return { inviting: null };
  });
}

// All cells within Manhattan distance ≤ range, excluding the origin.
function reachableCells(origin: string, range: number): string[] {
  const rows = Object.keys(BOARD) as BoardRow[];
  const [oRow, oCol] = parseCell(origin);
  const oRowIdx = rows.indexOf(oRow);
  const out: string[] = [];
  for (let dr = -range; dr <= range; dr++) {
    for (let dc = -range; dc <= range; dc++) {
      if (dr === 0 && dc === 0) continue;
      if (Math.abs(dr) + Math.abs(dc) > range) continue;
      const r = oRowIdx + dr;
      const c = oCol + dc;
      if (r < 0 || r >= rows.length || c < 1 || c > 8) continue;
      out.push(`${rows[r]}${c}`);
    }
  }
  return out;
}

export async function respondVehicleInvite(
  roomId: string,
  userId: string,
  accept: boolean,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const turn = must(
      await tx.turn.findUnique({ where: { roomId } }),
      "TURN_NOT_FOUND",
      "Turn not initialized",
    );
    if (turn.stage !== TURN_STAGES.VEHICLE_INVITE) {
      throw new EngineError("WRONG_STAGE", "No invite to respond to");
    }
    const cells = (turn.availableCells as string[]) ?? [];
    if (cells[2] !== userId) {
      throw new EngineError("NOT_INVITEE", "You are not the invited passenger");
    }
    const card = findCardByKey(cells[0]);
    const range = card && "value" in card ? card.value : 0;
    const driver = await tx.roomUser.findUnique({
      where: { roomId_userId: { roomId, userId: turn.currentUserId } },
    });
    const reach = driver?.position ? reachableCells(driver.position, range) : [];
    await tx.turn.update({
      where: { roomId },
      data: {
        stage: TURN_STAGES.VEHICLE_MOVE,
        availableCells: [cells[0], accept ? userId : "", ...reach],
      },
    });
  });
}

export async function driveVehicle(
  roomId: string,
  userId: string,
  destCell: string,
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
    if (turn.stage !== TURN_STAGES.VEHICLE_MOVE) {
      throw new EngineError("WRONG_STAGE", `Cannot drive in stage ${turn.stage}`);
    }
    const cells = (turn.availableCells as string[]) ?? [];
    const vehicleKey = cells[0];
    const passengerUserId = cells[1] || null;
    const card = findCardByKey(vehicleKey);
    if (!card || !("value" in card)) {
      throw new EngineError("INVALID_VEHICLE", "Vehicle card missing");
    }
    const driver = must(
      await tx.roomUser.findUnique({ where: { roomId_userId: { roomId, userId } } }),
      "USER_NOT_FOUND",
      "Driver not found",
    );
    if (!driver.position) {
      throw new EngineError("NO_POSITION", "Driver not on board");
    }

    const rows = Object.keys(BOARD) as BoardRow[];
    const [dRow, dCol] = parseCell(driver.position);
    const [tRow, tCol] = parseCell(destCell);
    const dist = manhattan(rows.indexOf(dRow), dCol, rows.indexOf(tRow), tCol);
    if (dist === 0 || dist > card.value) {
      throw new EngineError("OUT_OF_RANGE", `Vehicle can travel up to ${card.value} cells`);
    }

    // Move driver and passenger.
    await tx.roomUser.update({
      where: { roomId_userId: { roomId, userId } },
      data: { position: destCell },
    });
    if (passengerUserId) {
      await tx.roomUser.update({
        where: { roomId_userId: { roomId, userId: passengerUserId } },
        data: { position: destCell },
      });
    }

    // Discard vehicle to blue deck's discard pile.
    await tx.playerCard.delete({
      where: { roomId_userId_cardKey: { roomId, userId, cardKey: vehicleKey } },
    });
    const blueDeck = await tx.deck.findUnique({
      where: { roomId_deck: { roomId, deck: "BLUE" } },
    });
    if (blueDeck) {
      await tx.deck.update({
        where: { roomId_deck: { roomId, deck: "BLUE" } },
        data: { discard: [...((blueDeck.discard as string[]) ?? []), vehicleKey] },
      });
    }

    // Vehicles are noisy: apply sound penalty at the new position.
    await applySoundPenalty(tx, roomId, destCell);

    // Reaching row 'a' on a vehicle counts as winning.
    if (destCell.startsWith("a")) {
      await tx.roomUser.update({
        where: { roomId_userId: { roomId, userId } },
        data: { points: { increment: 100 } },
      });
      await tx.room.update({
        where: { id: roomId },
        data: { status: "FINISHED", winnerUserId: userId },
      });
      return;
    }

    // Return to MOVE stage; remaining movements (if any) carry over.
    await tx.turn.update({
      where: { roomId },
      data: { stage: TURN_STAGES.MOVE, availableCells: [] },
    });
  });
}

// --- Health (medicine, infection expiry, death + respawn) -------------------

// Discard MEDICINE → clear infection. Available at any stage so the player
// can cure themselves before/during a fight.
export async function useMedicine(roomId: string, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const card = await tx.playerCard.findFirst({
      where: { roomId, userId, cardKey: "medicine" },
    });
    if (!card) throw new EngineError("NO_MEDICINE", "Player has no medicine");
    await tx.playerCard.delete({
      where: { roomId_userId_cardKey: { roomId, userId, cardKey: "medicine" } },
    });
    const greenDeck = await tx.deck.findUnique({
      where: { roomId_deck: { roomId, deck: "GREEN" } },
    });
    if (greenDeck) {
      await tx.deck.update({
        where: { roomId_deck: { roomId, deck: "GREEN" } },
        data: { discard: [...((greenDeck.discard as string[]) ?? []), "medicine"] },
      });
    }
    await tx.roomUser.update({
      where: { roomId_userId: { roomId, userId } },
      data: { infectedUntilTurn: null },
    });
  });
}

// At end-of-turn (after zombie turn), kill any player whose infection has
// expired without a cure. Their cards return to the appropriate deck
// discard piles, and they respawn on the spawn line if the game isn't over.
async function resolveInfectionsAndDeaths(roomId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const turn = await tx.turn.findUnique({ where: { roomId } });
    if (!turn) return;
    const dying = await tx.roomUser.findMany({
      where: {
        roomId,
        health: { gt: 0 },
        infectedUntilTurn: { lte: turn.turnNumber, not: null },
      },
    });
    for (const p of dying) {
      // Return cards to their deck discards.
      const cards = await tx.playerCard.findMany({
        where: { roomId, userId: p.userId },
      });
      for (const c of cards) {
        const card = findCardByKey(c.cardKey);
        const deck = card
          ? card.type === GAME.CARDS_TYPES.GUN
            ? "RED"
            : card.type === GAME.CARDS_TYPES.VEHICLE
              ? "BLUE"
              : "GREEN"
          : "GREEN";
        const d = await tx.deck.findUnique({
          where: { roomId_deck: { roomId, deck } },
        });
        if (d) {
          await tx.deck.update({
            where: { roomId_deck: { roomId, deck } },
            data: { discard: [...((d.discard as string[]) ?? []), c.cardKey] },
          });
        }
      }
      await tx.playerCard.deleteMany({ where: { roomId, userId: p.userId } });
      // Mark dead temporarily, respawn at end if game isn't over.
      await tx.roomUser.update({
        where: { roomId_userId: { roomId, userId: p.userId } },
        data: {
          health: 0,
          infectedUntilTurn: null,
          position: null,
          points: { decrement: Math.min(p.points, 25) }, // light death penalty
        },
      });
    }
    // If the game is still WAITING/PLAYING, respawn dead players at the
    // spawn row (they'll pick a cell next turn via the existing tick logic).
    const room = await tx.room.findUnique({ where: { id: roomId } });
    if (room?.status === "PLAYING") {
      await tx.roomUser.updateMany({
        where: { roomId, health: 0 },
        data: { health: 1 },
      });
    }
  });
}

// Flee: skip the fight and continue moving with whatever movements remain.
// No penalty for now; vehicle-assisted flee can be richer in 4.7.
export async function fightFlee(roomId: string, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const turn = must(
      await tx.turn.findUnique({ where: { roomId } }),
      "TURN_NOT_FOUND",
      "Turn not initialized",
    );
    if (turn.currentUserId !== userId) {
      throw new EngineError("NOT_YOUR_TURN", "Not your turn");
    }
    if (turn.stage !== TURN_STAGES.FIGHT && turn.stage !== TURN_STAGES.HORDE_FIGHT) {
      throw new EngineError("WRONG_STAGE", "Not in a fight");
    }
    await tx.turn.update({
      where: { roomId },
      data: { stage: TURN_STAGES.MOVE, availableCells: [] },
    });
  });
}

// --- Loot resolution ---------------------------------------------------------
//
// Chest: needs roll ≥ 4 to open (or auto-open with a crowbar). Failure makes
// noise and triggers sound penalty (Step 4.5 will hook into this).
// Tent: needs roll ≥ 3. Failure also triggers sound penalty.
// Success draws one card from the green deck onto the player's hand.
const LOOT_THRESHOLD = { CHEST: 4, TENT: 3 } as const;

async function finishLoot(
  tx: Prisma.TransactionClient,
  roomId: string,
  userId: string,
  cell: string,
  success: boolean,
): Promise<void> {
  await tx.boardTile.update({
    where: { roomId_cell: { roomId, cell } },
    data: { looted: true },
  });
  if (success) {
    await drawCard(tx, roomId, userId, "GREEN");
    await tx.roomUser.update({
      where: { roomId_userId: { roomId, userId } },
      data: { points: { increment: 5 } },
    });
  }
  // Return to MOVE stage so the player can spend remaining movements.
  await tx.turn.update({
    where: { roomId },
    data: { stage: TURN_STAGES.MOVE, availableCells: [] },
  });
}

export async function lootRoll(
  roomId: string,
  userId: string,
  rollValue: number,
): Promise<{ success: boolean; soundPenalty: boolean }> {
  if (rollValue < 1 || rollValue > 6) {
    throw new EngineError("INVALID_ROLL", "Roll must be 1-6");
  }
  return prisma.$transaction(async (tx) => {
    const turn = must(
      await tx.turn.findUnique({ where: { roomId } }),
      "TURN_NOT_FOUND",
      "Turn not initialized",
    );
    if (turn.currentUserId !== userId) {
      throw new EngineError("NOT_YOUR_TURN", "Not your turn");
    }
    const isChest = turn.stage === TURN_STAGES.OPEN_CHEST;
    const isTent = turn.stage === TURN_STAGES.ENTER_TENT;
    if (!isChest && !isTent) {
      throw new EngineError("WRONG_STAGE", `Cannot loot in stage ${turn.stage}`);
    }
    const cells = (turn.availableCells as string[]) ?? [];
    const cell = cells[0];
    if (!cell) throw new EngineError("NO_CELL", "No loot target");

    const threshold = isChest ? LOOT_THRESHOLD.CHEST : LOOT_THRESHOLD.TENT;
    const success = rollValue >= threshold;
    await finishLoot(tx, roomId, userId, cell, success);
    if (!success) {
      const player = await tx.roomUser.findUnique({
        where: { roomId_userId: { roomId, userId } },
      });
      if (player?.position) await applySoundPenalty(tx, roomId, player.position);
    }
    return { success, soundPenalty: !success };
  });
}

// Crowbar auto-opens a chest with no roll and no sound. Consumes the crowbar
// (returns it to the green discard pile so it can recycle later).
export async function useCrowbar(roomId: string, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const turn = must(
      await tx.turn.findUnique({ where: { roomId } }),
      "TURN_NOT_FOUND",
      "Turn not initialized",
    );
    if (turn.currentUserId !== userId) {
      throw new EngineError("NOT_YOUR_TURN", "Not your turn");
    }
    if (turn.stage !== TURN_STAGES.OPEN_CHEST) {
      throw new EngineError("WRONG_STAGE", "Crowbar only works on chests");
    }
    const cell = ((turn.availableCells as string[]) ?? [])[0];
    if (!cell) throw new EngineError("NO_CELL", "No loot target");

    const crowbar = await tx.playerCard.findFirst({
      where: { roomId, userId, cardKey: "crowbar" },
    });
    if (!crowbar) throw new EngineError("NO_CROWBAR", "Player has no crowbar");

    // Discard the crowbar back to the green deck's discard pile.
    await tx.playerCard.delete({
      where: { roomId_userId_cardKey: { roomId, userId, cardKey: "crowbar" } },
    });
    const greenDeck = await tx.deck.findUnique({
      where: { roomId_deck: { roomId, deck: "GREEN" } },
    });
    if (greenDeck) {
      const discard = [...((greenDeck.discard as string[]) ?? []), "crowbar"];
      await tx.deck.update({
        where: { roomId_deck: { roomId, deck: "GREEN" } },
        data: { discard },
      });
    }

    await finishLoot(tx, roomId, userId, cell, true);
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

  // 2. Card-deal stage: assign turn order by initRollValue desc, deal one
  // card to each player based on roll parity (even → item, odd → weapon),
  // and transition to MOVE_ROLL for the first player.
  if (turn.stage === TURN_STAGES.GET_INITIAL_CARDS) {
    const ordered = [...room.users].sort(
      (a, b) => (b.initRollValue ?? 0) - (a.initRollValue ?? 0),
    );
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < ordered.length; i++) {
        const u = ordered[i];
        await tx.roomUser.update({
          where: { roomId_userId: { roomId, userId: u.userId } },
          data: { turnOrder: i },
        });
        const deck: "GREEN" | "RED" =
          (u.initRollValue ?? 0) % 2 === 0 ? "GREEN" : "RED";
        await drawCard(tx, roomId, u.userId, deck);
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

  // 4. MOVE stage with 0 movements left → run zombie turn, resolve any
  // expired infections (death + respawn), then cycle to the next player.
  if (turn.stage === TURN_STAGES.MOVE && turn.availableMovements === 0) {
    await runZombieTurn(roomId);
    await resolveInfectionsAndDeaths(roomId);

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

// Zombies + hordes move one cell toward the nearest living player. If a
// zombie steps onto a player's cell, the player is infected (firearm rule
// applies generically: 2 turns to consume MEDICINE or die in Step 4.8).
async function runZombieTurn(roomId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const players = await tx.roomUser.findMany({
      where: { roomId, position: { not: null }, health: { gt: 0 } },
    });
    if (players.length === 0) return;
    const zombies = await tx.zombie.findMany({ where: { roomId } });
    const rows = Object.keys(BOARD) as BoardRow[];

    for (const z of zombies) {
      const [zRow, zCol] = parseCell(z.position);
      const zRowIdx = rows.indexOf(zRow);
      // Pick nearest player.
      let target = players[0];
      let bestDist = Infinity;
      for (const p of players) {
        if (!p.position) continue;
        const [pRow, pCol] = parseCell(p.position);
        const d = manhattan(zRowIdx, zCol, rows.indexOf(pRow), pCol);
        if (d < bestDist) {
          bestDist = d;
          target = p;
        }
      }
      if (!target.position) continue;
      const [tRow, tCol] = parseCell(target.position);
      const tRowIdx = rows.indexOf(tRow);
      const dr = tRowIdx - zRowIdx;
      const dc = tCol - zCol;
      let nextRowIdx = zRowIdx;
      let nextCol = zCol;
      if (Math.abs(dr) >= Math.abs(dc) && dr !== 0) {
        nextRowIdx = zRowIdx + Math.sign(dr);
      } else if (dc !== 0) {
        nextCol = zCol + Math.sign(dc);
      }
      const nextCell = `${rows[nextRowIdx]}${nextCol}`;
      await tx.zombie.update({
        where: { roomId_zombieId: { roomId, zombieId: z.zombieId } },
        data: { position: nextCell },
      });

      // If the new cell is on a player, infect that player.
      const onTopOf = players.find((p) => p.position === nextCell);
      if (onTopOf) {
        const cur = await tx.turn.findUnique({ where: { roomId } });
        await tx.roomUser.update({
          where: { roomId_userId: { roomId, userId: onTopOf.userId } },
          data: { infectedUntilTurn: (cur?.turnNumber ?? 0) + 2 },
        });
      }
    }
  });
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
