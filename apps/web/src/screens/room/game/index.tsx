import React, { useCallback } from "react";
import Board from "./board";
import UserRolls from "./user-rolls";
import LootModal from "./loot-modal";
import FightModal from "./fight-modal";
import VehicleInviteModal from "./vehicle-invite-modal";
import { CardHand } from "../../../components";
import { CARDS_TYPES, type AnyCard } from "../../../utils";
import { useVehicle, useMedicine, type RoomSnapshot } from "../../../services";

interface GameProps {
  myUserId: string;
  room: RoomSnapshot;
  roomId: string;
}

const Game = ({ myUserId, room, roomId }: GameProps) => {
  const myCards = room.cards?.[myUserId] ?? [];
  const myTurn = room.turn?.currentUserId === myUserId;

  const handlePlay = useCallback(
    (card: AnyCard) => {
      if (card.type === CARDS_TYPES.VEHICLE) {
        useVehicle(roomId, myUserId, card.key).catch((err) =>
          console.error("[vehicle:use]", err),
        );
      } else if (card.key === "medicine") {
        useMedicine(roomId, myUserId).catch((err) =>
          console.error("[medicine]", err),
        );
      }
      // CROWBAR is handled by LootModal, weapons by FightModal.
    },
    [roomId, myUserId],
  );

  return (
    <>
      <UserRolls myUserId={myUserId} room={room} roomId={roomId} />
      <LootModal myUserId={myUserId} room={room} roomId={roomId} />
      <FightModal myUserId={myUserId} room={room} roomId={roomId} />
      <VehicleInviteModal myUserId={myUserId} room={room} roomId={roomId} />
      <Board myUserId={myUserId} room={room} roomId={roomId} />
      <CardHand cardKeys={myCards} onPlay={myTurn ? handlePlay : undefined} />
    </>
  );
};

export default Game;
