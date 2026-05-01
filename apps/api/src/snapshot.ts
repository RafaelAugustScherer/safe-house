import { prisma } from "./db";

// Single canonical room state shape broadcast on every mutation.
// Mirrors the old Firebase RTDB tree closely so the client port is small.
export interface RoomSnapshot {
  id: string;
  name: string;
  ownerUserId: string;
  maxUsers: number;
  status: "WAITING" | "PLAYING" | "FINISHED";
  users: Record<
    string,
    {
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
  >;
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
  userWinner: string | null;
}

export async function buildSnapshot(roomId: string): Promise<RoomSnapshot | null> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      users: { orderBy: { joinedAt: "asc" } },
      turn: true,
      zombies: true,
    },
  });
  if (!room) return null;

  const sequence = [...room.users]
    .filter((u) => u.turnOrder !== null)
    .sort((a, b) => (a.turnOrder ?? 0) - (b.turnOrder ?? 0))
    .map((u) => u.userId);

  return {
    id: room.id,
    name: room.name,
    ownerUserId: room.ownerUserId,
    maxUsers: room.maxUsers,
    status: room.status,
    users: Object.fromEntries(
      room.users.map((u) => [
        u.userId,
        {
          userId: u.userId,
          username: u.username,
          position: u.position,
          initRollValue: u.initRollValue,
          turnOrder: u.turnOrder,
          health: u.health,
          points: u.points,
          isOwner: u.isOwner,
          online: u.online,
        },
      ]),
    ),
    usersSequence: sequence,
    turn: room.turn
      ? {
          currentUserId: room.turn.currentUserId,
          stage: room.turn.stage,
          availableMovements: room.turn.availableMovements,
          availableCells: (room.turn.availableCells as string[]) ?? [],
          diceA: room.turn.diceA,
          diceB: room.turn.diceB,
          turnNumber: room.turn.turnNumber,
        }
      : null,
    zombies: Object.fromEntries(
      room.zombies.map((z) => [
        z.zombieId.toString(),
        { id: z.zombieId, position: z.position, kind: z.kind.toLowerCase() },
      ]),
    ),
    userWinner:
      room.status === "FINISHED"
        ? (room.users.find((u) => u.position?.startsWith("a"))?.userId ?? null)
        : null,
  };
}
