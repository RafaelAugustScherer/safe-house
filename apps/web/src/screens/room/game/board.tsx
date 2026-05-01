import React, { useCallback } from "react";
import styled from "styled-components";
import { playerMove, type RoomSnapshot } from "../../../services";
import { BOARD, GAME, TURN_STAGES } from "../../../utils";
import BoardHeader from "./board-header";

interface BoardProps {
  myUserId: string;
  room: RoomSnapshot;
  roomId: string;
}

const Board = ({ myUserId, room, roomId }: BoardProps) => {
  const { zombies, turn, users } = room;
  const players = Object.values(users);

  const handleMove = useCallback(
    (cell: string) => {
      playerMove(roomId, myUserId, cell).catch((err) => {
        console.error("[move]", err);
      });
    },
    [roomId, myUserId],
  );

  const myTurn = turn?.currentUserId === myUserId;
  const inMoveStage = turn?.stage === TURN_STAGES.MOVE && (turn?.availableMovements ?? 0) > 0;
  const availableCells = myTurn && inMoveStage ? (turn?.availableCells ?? []) : [];

  const renderCell = (lineId: string, cellIndex: number) => {
    const cellId = `${lineId}${cellIndex}`;
    let cellContent: React.ReactNode = cellId;

    for (const player of players) {
      if (player.position === cellId) {
        const initials = (player.username || "").slice(0, 2);
        cellContent = <Player>{initials}</Player>;
      }
    }
    for (const z of Object.values(zombies)) {
      if (z.position === cellId) {
        cellContent = <Zombie>{z.kind === "horde" ? "H" : "Z"}</Zombie>;
      }
    }

    const selectable = availableCells.includes(cellId);
    const onClick = selectable ? () => handleMove(cellId) : undefined;

    return (
      <td
        onClick={onClick}
        key={cellId}
        style={{
          border: selectable ? "2px solid green" : "1px solid white",
          cursor: selectable ? "pointer" : "default",
        }}
      >
        {cellContent}
      </td>
    );
  };

  // Show a "Win" cell when the player can step into the safe house.
  const canWin =
    myTurn && inMoveStage && (turn?.availableCells ?? []).includes(GAME.ACTIONS.WIN);

  return (
    <>
      <BoardHeader myUserId={myUserId} roomId={roomId} room={room} />
      {canWin && (
        <WinBanner onClick={() => handleMove(GAME.ACTIONS.WIN)}>
          Entrar na casa segura!
        </WinBanner>
      )}
      <StyledBoard>
        <tbody>
          {(Object.keys(BOARD) as Array<keyof typeof BOARD>).map((rowId) => (
            <tr key={rowId}>
              {BOARD[rowId].map((_, cellIndex) =>
                renderCell(rowId, cellIndex + 1),
              )}
            </tr>
          ))}
        </tbody>
      </StyledBoard>
    </>
  );
};

export default Board;

const StyledBoard = styled.table`
  background: black;
  border-spacing: 1px;
  td {
    text-align: center;
    background-color: #6aba6a;
    width: 10vw;
    max-width: 10vw;
    height: 6vh;
    max-height: 6vh;
    color: rgba(0, 0, 0, 0.3);
    @media (min-width: 720px) {
      width: 80px;
      max-width: 80px;
      height: 7.5vh;
      max-height: 7.5vh;
    }
  }
`;
const Player = styled.span`
  border-radius: 100%;
  background: red;
  color: white;
  padding: 0.5rem;
`;
const Zombie = styled(Player)`
  background: black;
  color: red;
  padding: 0.2rem 1rem;
  font-size: 2rem;
  @media (max-width: 720px) {
    font-size: 1.3rem;
    padding: 0.4rem 0.8rem;
  }
`;
const WinBanner = styled.button`
  margin: 1rem;
  padding: 1rem 2rem;
  background: ${({ theme }) => theme.colors.green};
  color: white;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  text-transform: uppercase;
`;
