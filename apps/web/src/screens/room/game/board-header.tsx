import React from "react";
import type { RoomSnapshot } from "../../../services";
import { TURN_STAGES } from "../../../utils";

interface BoardHeaderProps {
  myUserId: string;
  room: RoomSnapshot;
  roomId: string;
}

const BoardHeader = ({ myUserId, room }: BoardHeaderProps) => {
  const { turn, users } = room;
  if (!turn) return null;

  const isMyTurn = turn.currentUserId === myUserId;
  const currentUser = users[turn.currentUserId];

  const renderStatus = () => {
    if (turn.stage === TURN_STAGES.ROLL_INIT) return "Rolagem inicial...";
    if (turn.stage === TURN_STAGES.GET_INITIAL_CARDS) return "Distribuindo cartas...";
    if (!isMyTurn && currentUser) return `Vez de ${currentUser.username}`;
    return null;
  };

  return (
    <div style={{ margin: "1rem", textAlign: "center" }}>
      {renderStatus()}
      {isMyTurn && turn.availableMovements > 0 && (
        <span style={{ marginLeft: "1rem" }}>
          Movimentos restantes: {turn.availableMovements}
        </span>
      )}
    </div>
  );
};

export default BoardHeader;
