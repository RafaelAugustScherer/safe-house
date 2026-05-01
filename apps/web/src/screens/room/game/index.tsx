import React from "react";
import Board from "./board";
import UserRolls from "./user-rolls";
import { CardHand } from "../../../components";
import type { RoomSnapshot } from "../../../services";

interface GameProps {
  myUserId: string;
  room: RoomSnapshot;
  roomId: string;
}

const Game = ({ myUserId, room, roomId }: GameProps) => {
  const myCards = room.cards?.[myUserId] ?? [];
  return (
    <>
      <UserRolls myUserId={myUserId} room={room} roomId={roomId} />
      <Board myUserId={myUserId} room={room} roomId={roomId} />
      <CardHand cardKeys={myCards} />
    </>
  );
};

export default Game;
