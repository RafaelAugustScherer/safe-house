import React, { useCallback } from "react";
import styled from "styled-components";
import { firebasePlayerMove } from "../../../services";
import { GAME, BOARD } from "../../../utils";
import BoardHeader from "./board-header";

const Board = ({ myUserId, room, roomId }) => {
  let { zombies = [], turn = {}, users = {} } = room;
  let players = Object.entries(users).map((array) => ({
    id: array[0],
    ...array[1],
  }));

  const playerMove = useCallback(
    (lineId, cellIndex) =>
      firebasePlayerMove(roomId, myUserId, lineId, cellIndex),
    [roomId, myUserId]
  );

  const renderCell = (lineId, cellIndex) => {
    let cellId = lineId + cellIndex;
    let cellContent = cellId;
    var avaliableCells = [];
    if (turn?.userId === myUserId && turn?.avaliableCells)
      avaliableCells = Object.entries(turn.avaliableCells).map(
        (array) => array[1]
      );
    // let cellClick = () => setAvaliableCells([]);
    let cellClick = () => {};

    players.forEach((player) => {
      if (player.position === cellId)
        cellContent = (
          <Player>{player.username[0] + player.username[1]}</Player>
        );
    });
    if (zombies)
      zombies.forEach((zombie) => {
        if (zombie.position === cellId) cellContent = <Zombie>Z</Zombie>;
      });
    if (
      myUserId === turn?.userId &&
      turn?.action === GAME.ACTIONS.MOVE &&
      turn?.avaliableMoviments > 0
    ) {
      if (avaliableCells.includes(cellId)) {
        cellClick = () => playerMove(lineId, cellIndex);
      }
    }

    let selectable =
      avaliableCells.includes(cellId) && turn?.avaliableMoviments > 0;

    return (
      <td
        onClick={cellClick}
        key={cellId}
        style={{
          border: selectable ? "2px solid green" : "white",
          cursor: selectable ? "pointer" : "default",
        }}
      >
        {cellContent}
      </td>
    );
  };

  return (
    <>
      <BoardHeader myUserId={myUserId} roomId={roomId} room={room} />
      <StyledBoard>
        <tbody>
          {Object.entries(BOARD).map((line) => (
            <tr key={line[0]}>
              {line[1].map((cell, cellIndex) =>
                renderCell(line[0], cellIndex + 1)
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
