-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'PLAYING', 'FINISHED');

-- CreateEnum
CREATE TYPE "ZombieKind" AS ENUM ('SINGLE', 'HORDE');

-- CreateEnum
CREATE TYPE "DeckColor" AS ENUM ('RED', 'GREEN', 'BLUE');

-- CreateEnum
CREATE TYPE "CardSlot" AS ENUM ('ITEM', 'WEAPON', 'VEHICLE');

-- CreateEnum
CREATE TYPE "TileType" AS ENUM ('EMPTY', 'CHEST', 'TENT');

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "maxUsers" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_users" (
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "position" TEXT,
    "health" INTEGER NOT NULL DEFAULT 1,
    "infectedUntilTurn" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "initRollValue" INTEGER,
    "turnOrder" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "online" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "room_users_pkey" PRIMARY KEY ("roomId","userId")
);

-- CreateTable
CREATE TABLE "turns" (
    "roomId" TEXT NOT NULL,
    "currentUserId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "availableMovements" INTEGER NOT NULL DEFAULT 0,
    "availableCells" JSONB NOT NULL,
    "diceA" INTEGER,
    "diceB" INTEGER,
    "turnNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turns_pkey" PRIMARY KEY ("roomId")
);

-- CreateTable
CREATE TABLE "zombies" (
    "roomId" TEXT NOT NULL,
    "zombieId" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "kind" "ZombieKind" NOT NULL,

    CONSTRAINT "zombies_pkey" PRIMARY KEY ("roomId","zombieId")
);

-- CreateTable
CREATE TABLE "decks" (
    "roomId" TEXT NOT NULL,
    "deck" "DeckColor" NOT NULL,
    "cards" JSONB NOT NULL,
    "discard" JSONB NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("roomId","deck")
);

-- CreateTable
CREATE TABLE "player_cards" (
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardKey" TEXT NOT NULL,
    "slot" "CardSlot" NOT NULL,

    CONSTRAINT "player_cards_pkey" PRIMARY KEY ("roomId","userId","cardKey")
);

-- CreateTable
CREATE TABLE "board_tiles" (
    "roomId" TEXT NOT NULL,
    "cell" TEXT NOT NULL,
    "tileType" "TileType" NOT NULL,
    "looted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "board_tiles_pkey" PRIMARY KEY ("roomId","cell")
);

-- CreateTable
CREATE TABLE "game_events" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_events_roomId_createdAt_idx" ON "game_events"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turns" ADD CONSTRAINT "turns_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zombies" ADD CONSTRAINT "zombies_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_cards" ADD CONSTRAINT "player_cards_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_cards" ADD CONSTRAINT "player_cards_roomId_userId_fkey" FOREIGN KEY ("roomId", "userId") REFERENCES "room_users"("roomId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_tiles" ADD CONSTRAINT "board_tiles_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
