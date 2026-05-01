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
  const me = users[myUserId];

  const renderStatus = () => {
    if (turn.stage === TURN_STAGES.ROLL_INIT) return "Rolagem inicial...";
    if (turn.stage === TURN_STAGES.GET_INITIAL_CARDS) return "Distribuindo cartas...";
    if (!isMyTurn && currentUser) return `Vez de ${currentUser.username}`;
    return null;
  };

  const infected =
    me?.infectedUntilTurn != null && me.infectedUntilTurn >= turn.turnNumber;

  return (
    <div style={{ margin: "1rem", textAlign: "center" }}>
      {renderStatus()}
      {isMyTurn && turn.availableMovements > 0 && (
        <span style={{ marginLeft: "1rem" }}>
          Movimentos restantes: {turn.availableMovements}
        </span>
      )}
      {infected && (
        <div style={{ color: "#e70000", marginTop: "0.5rem" }}>
          ⚠ Infectado! Use a Bandagem antes do turno {(me!.infectedUntilTurn ?? 0) + 1}
        </div>
      )}
    </div>
  );
};

export default BoardHeader;
