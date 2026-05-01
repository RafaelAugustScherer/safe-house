import React, { useCallback } from "react";
import { Button } from "../../../components";
import { GAME } from "../../../utils";
import { firebaseWinGame } from "../../../services/game.service";

const BoardHeader = ({ myUserId, room, roomId }) => {
  let { turn = {}, users = {} } = room;

  const handleWinGame = useCallback(
    () => firebaseWinGame(roomId, users[myUserId].username),
    [roomId, myUserId, users]
  );

  const renderWin = () => {
    if (
      turn?.userId === myUserId &&
      turn?.avaliableCells?.includes(GAME.ACTIONS.WIN)
    )
      return (
        <Button size="small" onClick={handleWinGame}>
          Entrar na casa
        </Button>
      );
  };

  const renderAnotherPlayerTurn = () => {
    if (turn?.action === GAME.ACTIONS.ROLL_INIT) return `Rolagem inicial...`;
    else if (turn?.userId !== myUserId && users[turn.userId])
      return `Vez de ${users[turn.userId].username}`;
  };

  return (
    <>
      {renderWin()}
      {renderAnotherPlayerTurn()}
      {turn &&
        turn.userId === myUserId &&
        turn.avaliableMoviments &&
        "Movimentos: " + turn.avaliableMoviments}
    </>
  );
};

export default BoardHeader;
