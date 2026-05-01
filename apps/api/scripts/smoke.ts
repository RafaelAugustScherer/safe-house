// Manual end-to-end smoke test for the API.
// Runs two Socket.IO clients through a full game-start sequence to verify
// the rule engine. Intended for local invocation: `npm run smoke`.
// Formal test infra (vitest) is deferred to Step 5.

import { strict as assert } from "node:assert";
import type { AddressInfo } from "node:net";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";
import { createServer } from "../src/server";
import { prisma } from "../src/db";
import type { RoomSnapshot } from "../src/snapshot";

const ack = <T>(socket: ClientSocket, event: string, payload: unknown) =>
  new Promise<T>((resolve, reject) => {
    socket.emit(event, payload, (res: { ok: true; data: T } | { ok: false; error: string }) => {
      if (res.ok) resolve(res.data);
      else reject(new Error(res.error));
    });
  });

const nextSnapshot = (socket: ClientSocket, predicate: (s: RoomSnapshot) => boolean) =>
  new Promise<RoomSnapshot>((resolve) => {
    const handler = (s: RoomSnapshot) => {
      if (predicate(s)) {
        socket.off("snapshot", handler);
        resolve(s);
      }
    };
    socket.on("snapshot", handler);
  });

async function main() {
  // Hermetic: wipe existing rooms.
  await prisma.gameEvent.deleteMany({});
  await prisma.boardTile.deleteMany({});
  await prisma.playerCard.deleteMany({});
  await prisma.deck.deleteMany({});
  await prisma.zombie.deleteMany({});
  await prisma.turn.deleteMany({});
  await prisma.roomUser.deleteMany({});
  await prisma.room.deleteMany({});

  const { httpServer, io } = createServer("http://localhost:3000");
  await new Promise<void>((r) => httpServer.listen(0, r));
  const port = (httpServer.address() as AddressInfo).port;
  const url = `http://localhost:${port}`;
  console.log(`[smoke] server on ${url}`);

  const owner = ioc(url, { transports: ["websocket"], forceNew: true });
  const guest = ioc(url, { transports: ["websocket"], forceNew: true });
  await new Promise<void>((r) => owner.on("connect", () => r()));
  await new Promise<void>((r) => guest.on("connect", () => r()));

  const { roomId } = await ack<{ roomId: string }>(owner, "room:create", {
    name: "Smoke",
    maxUsers: 2,
    ownerUserId: "alice",
    ownerUsername: "Alice",
  });
  console.log(`[smoke] room ${roomId} created`);

  await ack(guest, "room:join", { roomId, userId: "bob", username: "Bob" });
  await ack(guest, "room:subscribe", { roomId, userId: "bob" });

  // Pre-attach the listener before the trigger to avoid a race against broadcast.
  const rollingP = nextSnapshot(owner, (s) => s.turn?.stage === "roll-init");
  await ack(owner, "game:start", { roomId });
  const rolling = await rollingP;
  assert.equal(rolling.status, "PLAYING");
  assert.equal(Object.keys(rolling.users).length, 2);
  console.log(`[smoke] game started, ${Object.keys(rolling.users).length} players in ROLL_INIT`);

  const moveRollP = nextSnapshot(owner, (s) => s.turn?.stage === "move-roll");
  await ack(owner, "roll:initial", { roomId, userId: "alice", value: 5 });
  await ack(guest, "roll:initial", { roomId, userId: "bob", value: 3 });
  const moveRoll = await moveRollP;
  assert.equal(moveRoll.turn?.currentUserId, "alice", "highest initial-roll player goes first");
  assert.deepEqual(moveRoll.usersSequence, ["alice", "bob"]);
  console.log(`[smoke] turn order: ${moveRoll.usersSequence.join(" → ")}`);

  const movingP = nextSnapshot(
    owner,
    (s) => s.turn?.stage === "move" && (s.turn?.availableCells?.length ?? 0) > 0,
  );
  await ack(owner, "roll:normal", { roomId, userId: "alice", diceA: 5, diceB: 1 });
  const moving = await movingP;
  assert.equal(moving.turn?.availableMovements, 4, "5-1 = 4 movements");
  assert.equal(moving.turn?.availableCells?.length, 8, "spawn line has 8 cells");
  assert.ok(
    moving.turn?.availableCells?.every((c) => c.startsWith("l")),
    "all spawn cells are on row 'l'",
  );
  console.log(`[smoke] alice rolled 5,1 → ${moving.turn?.availableMovements} moves on spawn line`);

  // Move alice 4 times toward the safe house. Pre-attach the next-snapshot
  // listener BEFORE each move so we don't miss the broadcast.
  let nextCell = "l4";
  for (let i = 0; i < 4; i++) {
    const isLast = i === 3;
    const waitP = isLast
      ? nextSnapshot(owner, (s) => s.turn?.currentUserId === "bob")
      : nextSnapshot(
          owner,
          (s) =>
            s.turn?.stage === "move" &&
            (s.turn?.availableCells?.length ?? 0) > 0 &&
            s.turn?.availableMovements === 3 - i,
        );
    await ack(owner, "move", { roomId, userId: "alice", cell: nextCell });
    const next = await waitP;
    if (!isLast) {
      const upward = next.turn!.availableCells.find((c) => !c.startsWith(nextCell[0]));
      assert.ok(upward, `expected upward cell after ${nextCell}`);
      nextCell = upward;
    }
  }

  const cycled = await prisma.turn.findUnique({ where: { roomId } });
  assert.equal(cycled?.stage, "move-roll");
  assert.equal(cycled?.currentUserId, "bob");
  console.log(`[smoke] alice spent her movements; turn passed to bob`);

  owner.disconnect();
  guest.disconnect();
  io.close();
  await new Promise<void>((r) => httpServer.close(() => r()));
  await prisma.$disconnect();
  console.log("[smoke] PASS");
}

main().catch((e) => {
  console.error("[smoke] FAIL:", e);
  process.exit(1);
});
