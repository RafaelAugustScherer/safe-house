import React, { useCallback, useState } from "react";
import styled from "styled-components";
import Dice from "react-dice-roll";
import { Modal } from "../../../components";
import { GAME, rollDice } from "../../../utils";
import {
  firebaseRollInitialDice,
  firebaseRollNormalDice,
} from "../../../services";

const UserRolls = ({ myUserId, room, roomId }) => {
  const [rollValue, setRollValue] = useState(rollDice());
  let { turn = {}, users = {} } = room;
  let myUser = users[myUserId];
  let rollingTime = 2000;

  //-------------------ACTIONS FUNCTIONS

  const rollInitDice = useCallback(() => {
    setTimeout(() => {
      firebaseRollInitialDice(roomId, myUserId, rollValue).then(() =>
        setRollValue(rollDice())
      );
    }, rollingTime);
  }, [roomId, myUserId, rollValue, rollingTime]);

  const rollNormalDice = useCallback(() => {
    setTimeout(() => {
      firebaseRollNormalDice(roomId, rollValue).then(() =>
        setRollValue(rollDice())
      );
    }, rollingTime);
  }, [roomId, rollValue, rollingTime]);

  //-------------------TESTS FUNCTIONS
  const isInitialRollAndINeedRoll = () =>
    turn?.userId === GAME.TURN_USER.ALL_USERS && !myUser?.initRollValue;

  if (isInitialRollAndINeedRoll()) {
    return (
      <Modal>
        <label
          style={{
            width: "80vw",
            maxWidth: "600px",
            textAlign: "center",
            fontSize: "1.5rem",
          }}
        >
          Vamos lá! Role o dado, quem tirar o maior número começa. Além disso:
        </label>
        <InitDiceValueReward>
          Resultado par = Começa com 1 item <br />
          Resultado ímpar = Começa com 1 arma
        </InitDiceValueReward>
        <div style={{ margin: "2rem" }}>
          <Dice
            cheatValue={rollValue}
            size={50}
            rollingTime={rollingTime}
            onRoll={rollInitDice}
          />
        </div>
      </Modal>
    );
  } else if (turn?.userId === myUserId && turn?.action === GAME.ACTIONS.ROLL)
    return (
      <Modal>
        <label
          style={{
            width: "80vw",
            maxWidth: "600px",
            textAlign: "center",
            fontSize: "1.5rem",
          }}
        >
          Sua vez de jogar!
        </label>
        <div style={{ margin: "2rem" }}>
          <Dice
            cheatValue={rollValue}
            size={50}
            rollingTime={rollingTime}
            onRoll={rollNormalDice}
          />
        </div>
      </Modal>
    );
  else return <></>;
};

export default UserRolls;

const InitDiceValueReward = styled.div`
  background: white;
  color: black;
  padding: 0.5rem;
  margin: 1rem;
`;
