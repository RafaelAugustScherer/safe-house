import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import Dice from "react-dice-roll";
import { Button, Modal } from "../../../components";
import { TURN_STAGES, findCardByKey, rollDice } from "../../../utils";
import { fightAttack, fightFlee, type RoomSnapshot } from "../../../services";

interface FightModalProps {
  myUserId: string;
  room: RoomSnapshot;
  roomId: string;
}

const ROLLING_TIME_MS = 2000;

const FightModal = ({ myUserId, room, roomId }: FightModalProps) => {
  const turn = room.turn;
  const isFight =
    turn?.stage === TURN_STAGES.FIGHT || turn?.stage === TURN_STAGES.HORDE_FIGHT;
  const isHorde = turn?.stage === TURN_STAGES.HORDE_FIGHT;
  const isMyTurn = turn?.currentUserId === myUserId;

  const myCards = room.cards?.[myUserId] ?? [];
  const weapons = myCards
    .map((k) => findCardByKey(k))
    .filter((c): c is NonNullable<ReturnType<typeof findCardByKey>> => !!c)
    .filter((c) => "normalValue" in c);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const value = useMemo(() => rollDice(), [selectedKey]);

  const handleAttack = useCallback(() => {
    if (!selectedKey) return;
    const k = selectedKey;
    setTimeout(() => {
      fightAttack(roomId, myUserId, k, value).catch((err) =>
        console.error("[fight:attack]", err),
      );
    }, ROLLING_TIME_MS);
  }, [roomId, myUserId, selectedKey, value]);

  const handleFlee = useCallback(() => {
    fightFlee(roomId, myUserId).catch((err) => console.error("[fight:flee]", err));
  }, [roomId, myUserId]);

  if (!isMyTurn || !isFight) return null;

  return (
    <Modal>
      <Label>
        {isHorde
          ? "🧟‍♂️🧟‍♀️ Uma horda apareceu! Lute ou fuja!"
          : "🧟 Um zumbi apareceu! Lute ou fuja!"}
      </Label>
      {weapons.length === 0 ? (
        <Hint>Você não tem armas. Apenas fugir é possível.</Hint>
      ) : !selectedKey ? (
        <>
          <Hint>Escolha uma arma:</Hint>
          <WeaponList>
            {weapons.map((w, i) => (
              <Weapon key={`${w.key}-${i}`} onClick={() => setSelectedKey(w.key)}>
                <strong>{w.name}</strong>
                <small>
                  ≥ {(w as { normalValue: number }).normalValue}
                  {(w as { specialValue: number }).specialValue > 0 &&
                    ` · bônus ≥ ${6 - (w as { specialValue: number }).specialValue}`}
                </small>
              </Weapon>
            ))}
          </WeaponList>
        </>
      ) : (
        <>
          <Hint>
            Atacando com{" "}
            <strong>{findCardByKey(selectedKey)?.name}</strong> (precisa ≥{" "}
            {(findCardByKey(selectedKey) as { normalValue: number }).normalValue})
          </Hint>
          <DiceWrap>
            <Dice
              cheatValue={value as 1 | 2 | 3 | 4 | 5 | 6}
              size={50}
              rollingTime={ROLLING_TIME_MS}
              onRoll={handleAttack}
            />
          </DiceWrap>
          <Button size="small" onClick={() => setSelectedKey(null)}>
            Trocar arma
          </Button>
        </>
      )}
      <Button size="small" onClick={handleFlee} style={{ marginTop: "1rem" }}>
        Fugir
      </Button>
    </Modal>
  );
};

export default FightModal;

const Label = styled.label`
  width: 80vw;
  max-width: 600px;
  text-align: center;
  font-size: 1.3rem;
  margin-top: 1rem;
`;
const WeaponList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem;
  justify-content: center;
`;
const Weapon = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  small {
    opacity: 0.7;
    font-size: 0.8rem;
  }
`;
const DiceWrap = styled.div`
  margin: 1.5rem;
`;
const Hint = styled.p`
  font-size: 0.95rem;
  margin: 0.5rem;
  text-align: center;
`;
