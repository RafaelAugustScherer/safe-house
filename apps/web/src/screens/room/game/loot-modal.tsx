import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import Dice from "react-dice-roll";
import { Button, Modal } from "../../../components";
import { TURN_STAGES, rollDice } from "../../../utils";
import { lootRoll, useCrowbar, type RoomSnapshot } from "../../../services";

interface LootModalProps {
  myUserId: string;
  room: RoomSnapshot;
  roomId: string;
}

const ROLLING_TIME_MS = 2000;

const LootModal = ({ myUserId, room, roomId }: LootModalProps) => {
  const turn = room.turn;
  const isChest = turn?.stage === TURN_STAGES.OPEN_CHEST;
  const isTent = turn?.stage === TURN_STAGES.ENTER_TENT;
  const isMyTurn = turn?.currentUserId === myUserId;
  const myCards = room.cards?.[myUserId] ?? [];
  const hasCrowbar = myCards.includes("crowbar");

  const value = useMemo(
    () => rollDice(),
    // Re-roll on stage change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [turn?.stage],
  );

  const handleRoll = useCallback(() => {
    setTimeout(() => {
      lootRoll(roomId, myUserId, value).catch((err) =>
        console.error("[loot:roll]", err),
      );
    }, ROLLING_TIME_MS);
  }, [roomId, myUserId, value]);

  const handleCrowbar = useCallback(() => {
    useCrowbar(roomId, myUserId).catch((err) =>
      console.error("[loot:crowbar]", err),
    );
  }, [roomId, myUserId]);

  if (!isMyTurn || (!isChest && !isTent)) return null;

  return (
    <Modal>
      <Label>
        {isChest
          ? "📦 Você encontrou uma caixa! Role o dado (≥ 4 para abrir)."
          : "⛺ Você encontrou uma tenda! Role o dado (≥ 3 para entrar)."}
      </Label>
      <DiceWrap>
        <Dice
          cheatValue={value as 1 | 2 | 3 | 4 | 5 | 6}
          size={50}
          rollingTime={ROLLING_TIME_MS}
          onRoll={handleRoll}
        />
      </DiceWrap>
      {isChest && hasCrowbar && (
        <Button size="small" onClick={handleCrowbar}>
          Usar pé de cabra (auto-sucesso)
        </Button>
      )}
      <Hint>Falha → barulho atrai a horda</Hint>
    </Modal>
  );
};

export default LootModal;

const Label = styled.label`
  width: 80vw;
  max-width: 600px;
  text-align: center;
  font-size: 1.3rem;
  margin-top: 1rem;
`;
const DiceWrap = styled.div`
  margin: 2rem;
`;
const Hint = styled.p`
  font-size: 0.9rem;
  opacity: 0.7;
  margin: 0.5rem;
`;
