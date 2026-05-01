import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import Dice from "react-dice-roll";
import { Modal } from "../../../components";
import { TURN_STAGES, TURN_USER, rollDice } from "../../../utils";
import { rollInitial, rollNormal, type RoomSnapshot } from "../../../services";

interface UserRollsProps {
  myUserId: string;
  room: RoomSnapshot;
  roomId: string;
}

const ROLLING_TIME_MS = 2000;

const UserRolls = ({ myUserId, room, roomId }: UserRollsProps) => {
  const turn = room.turn;
  const myUser = room.users[myUserId];

  const initRollValue = useMemo(() => rollDice(), []);
  const normalDiceA = useMemo(() => rollDice(), [turn?.turnNumber, turn?.currentUserId]);
  const normalDiceB = useMemo(() => rollDice(), [turn?.turnNumber, turn?.currentUserId]);

  const handleInitialRoll = useCallback(() => {
    setTimeout(() => {
      rollInitial(roomId, myUserId, initRollValue).catch((err) => {
        console.error("[roll:initial]", err);
      });
    }, ROLLING_TIME_MS);
  }, [roomId, myUserId, initRollValue]);

  const handleNormalRoll = useCallback(() => {
    setTimeout(() => {
      rollNormal(roomId, myUserId, normalDiceA, normalDiceB).catch((err) => {
        console.error("[roll:normal]", err);
      });
    }, ROLLING_TIME_MS);
  }, [roomId, myUserId, normalDiceA, normalDiceB]);

  // Initial roll: turn user is ALL_USERS and I haven't rolled yet.
  if (
    turn?.stage === TURN_STAGES.ROLL_INIT &&
    turn.currentUserId === TURN_USER.ALL_USERS &&
    myUser &&
    myUser.initRollValue == null
  ) {
    return (
      <Modal>
        <Label>Vamos lá! Role o dado, quem tirar o maior número começa.</Label>
        <div style={{ margin: "2rem" }}>
          <Dice
            cheatValue={initRollValue as 1 | 2 | 3 | 4 | 5 | 6}
            size={50}
            rollingTime={ROLLING_TIME_MS}
            onRoll={handleInitialRoll}
          />
        </div>
      </Modal>
    );
  }

  // Normal roll: it's my turn and I'm in MOVE_ROLL stage.
  if (turn?.stage === TURN_STAGES.MOVE_ROLL && turn.currentUserId === myUserId) {
    return (
      <Modal>
        <Label>Sua vez de jogar! Role os dois dados.</Label>
        <DiceRow>
          <Dice
            cheatValue={normalDiceA as 1 | 2 | 3 | 4 | 5 | 6}
            size={50}
            rollingTime={ROLLING_TIME_MS}
            onRoll={handleNormalRoll}
          />
          <Dice
            cheatValue={normalDiceB as 1 | 2 | 3 | 4 | 5 | 6}
            size={50}
            rollingTime={ROLLING_TIME_MS}
          />
        </DiceRow>
        <Hint>
          Você se moverá pela diferença absoluta entre os dois dados.
        </Hint>
      </Modal>
    );
  }

  return null;
};

export default UserRolls;

const Label = styled.label`
  width: 80vw;
  max-width: 600px;
  text-align: center;
  font-size: 1.5rem;
`;
const DiceRow = styled.div`
  display: flex;
  gap: 2rem;
  margin: 2rem;
`;
const Hint = styled.div`
  background: white;
  color: black;
  padding: 0.5rem;
  margin: 1rem;
`;
