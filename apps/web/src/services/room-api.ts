import { emitAck, getSocket } from "./socket";

export interface RoomListItem {
  id: string;
  name: string;
  maxUsers: number;
  currentUsers: number;
  ownerUserId: string;
}

export interface RoomSnapshotUser {
  userId: string;
  username: string;
  position: string | null;
  initRollValue: number | null;
  turnOrder: number | null;
  health: number;
  points: number;
  isOwner: boolean;
  online: boolean;
}

export interface RoomSnapshot {
  id: string;
  name: string;
  ownerUserId: string;
  maxUsers: number;
  status: "WAITING" | "PLAYING" | "FINISHED";
  users: Record<string, RoomSnapshotUser>;
  usersSequence: string[];
  turn: {
    currentUserId: string;
    stage: string;
    availableMovements: number;
    availableCells: string[];
    diceA: number | null;
    diceB: number | null;
    turnNumber: number;
  } | null;
  zombies: Record<string, { id: number; position: string; kind: string }>;
  tiles: Record<string, { cell: string; tileType: string; looted: boolean }>;
  cards: Record<string, string[]>;
  deckCounts: { red: number; green: number; blue: number };
  userWinner: string | null;
}

export const createRoom = (input: {
  name: string;
  maxUsers: number;
  ownerUserId: string;
  ownerUsername: string;
}): Promise<{ roomId: string }> => emitAck("room:create", input);

export const joinRoom = (input: { roomId: string; userId: string; username: string }): Promise<unknown> =>
  emitAck("room:join", input);

export const subscribeRoom = (input: { roomId: string; userId?: string }): Promise<unknown> =>
  emitAck("room:subscribe", input);

export const exitRoom = (input: { roomId: string; userId: string }): Promise<unknown> =>
  emitAck("room:exit", input);

export const listRooms = (): Promise<RoomListItem[]> => emitAck("room:list", null);

export const startGame = (roomId: string): Promise<unknown> => emitAck("game:start", { roomId });

export const rollInitial = (roomId: string, userId: string, value: number): Promise<unknown> =>
  emitAck("roll:initial", { roomId, userId, value });

export const rollNormal = (
  roomId: string,
  userId: string,
  diceA: number,
  diceB: number,
): Promise<unknown> => emitAck("roll:normal", { roomId, userId, diceA, diceB });

export const playerMove = (roomId: string, userId: string, cell: string): Promise<{ won: boolean }> =>
  emitAck("move", { roomId, userId, cell });

export const lootRoll = (
  roomId: string,
  userId: string,
  value: number,
): Promise<{ success: boolean; soundPenalty: boolean }> =>
  emitAck("loot:roll", { roomId, userId, value });

export const useCrowbar = (roomId: string, userId: string): Promise<unknown> =>
  emitAck("loot:use-crowbar", { roomId, userId });

export const fightAttack = (
  roomId: string,
  userId: string,
  weaponKey: string,
  value: number,
): Promise<{ killed: boolean; infected: boolean; bonus: boolean; soundPenalty: boolean }> =>
  emitAck("fight:attack", { roomId, userId, weaponKey, value });

export const fightFlee = (roomId: string, userId: string): Promise<unknown> =>
  emitAck("fight:flee", { roomId, userId });

// Subscribe to push events from a single room.
export function onSnapshot(handler: (snap: RoomSnapshot) => void): () => void {
  const sock = getSocket();
  sock.on("snapshot", handler);
  return () => sock.off("snapshot", handler);
}

export function onRoomDeleted(handler: (payload: { roomId: string }) => void): () => void {
  const sock = getSocket();
  sock.on("room:deleted", handler);
  return () => sock.off("room:deleted", handler);
}
