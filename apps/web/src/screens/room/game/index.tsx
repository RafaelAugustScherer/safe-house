import React from "react";
import Board from "./board";
import UserRolls from "./user-rolls";
import type { RoomSnapshot } from "../../../services";

interface GameProps {
  myUserId: string;
  room: RoomSnapshot;
  roomId: string;
}

const Game = ({ myUserId, room, roomId }: GameProps) => {
  return (
    <>
      <UserRolls myUserId={myUserId} room={room} roomId={roomId} />
      <Board myUserId={myUserId} room={room} roomId={roomId} />
    </>
  );
};

export default Game;
