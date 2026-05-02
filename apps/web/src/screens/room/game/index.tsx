import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Board from "./board";
import UserRolls from "./user-rolls";
import LootModal from "./loot-modal";
import FightModal from "./fight-modal";
import VehicleInviteModal from "./vehicle-invite-modal";
import { CardHand, CardDetailsRail } from "../../../components";
import {
  CARDS_TYPES,
  findCardByKey,
  type AnyCard,
} from "../../../utils";
import { useVehicle, useMedicine, type RoomSnapshot } from "../../../services";

interface GameProps {
  myUserId: string;
  room: RoomSnapshot;
  roomId: string;
}

const Game = ({ myUserId, room, roomId }: GameProps) => {
  const myCards = room.cards?.[myUserId] ?? [];
  const myTurn = room.turn?.currentUserId === myUserId;

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Resolve the selected hand-instance to a card definition. Instance keys are
  // `${cardKey}-${index}` (matching CardHand) — card keys can contain dashes
  // (e.g. "walkie-talkie") so we rebuild & compare rather than split.
  const selectedCard = useMemo<AnyCard | null>(() => {
    if (!selectedKey) return null;
    const idx = myCards.findIndex((k, i) => `${k}-${i}` === selectedKey);
    if (idx < 0) return null;
    return findCardByKey(myCards[idx]) ?? null;
  }, [selectedKey, myCards]);

  // Drop selection when the card leaves the hand (played, lost, etc.).
  useEffect(() => {
    if (selectedKey && !myCards.some((k, i) => `${k}-${i}` === selectedKey)) {
      setSelectedKey(null);
    }
  }, [myCards, selectedKey]);

  const handlePlay = useCallback(
    (card: AnyCard) => {
      if (card.type === CARDS_TYPES.VEHICLE) {
        useVehicle(roomId, myUserId, card.key).catch((err) =>
          console.error("[vehicle:use]", err),
        );
      } else if (card.key === "medicine") {
        useMedicine(roomId, myUserId).catch((err) =>
          console.error("[medicine]", err),
        );
      }
      // CROWBAR is handled by LootModal, weapons by FightModal.
    },
    [roomId, myUserId],
  );

  return (
    <>
      <UserRolls myUserId={myUserId} room={room} roomId={roomId} />
      <LootModal myUserId={myUserId} room={room} roomId={roomId} />
      <FightModal myUserId={myUserId} room={room} roomId={roomId} />
      <VehicleInviteModal myUserId={myUserId} room={room} roomId={roomId} />
      <Layout>
        <BoardArea>
          <Board myUserId={myUserId} room={room} roomId={roomId} />
        </BoardArea>
        <RailArea>
          <CardDetailsRail card={selectedCard} />
        </RailArea>
        <HandArea>
          <CardHand
            cardKeys={myCards}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            onPlay={myTurn ? handlePlay : undefined}
          />
        </HandArea>
      </Layout>
      <Scoreboard>
        {Object.values(room.users).map((u) => (
          <li key={u.userId}>
            <strong>{u.username}</strong>
            {": "}
            {u.points} pts
            {u.infectedUntilTurn != null &&
              room.turn &&
              u.infectedUntilTurn >= room.turn.turnNumber && (
                <span style={{ color: "#e70000" }}> ⚠ infectado</span>
              )}
            {u.userId === room.turn?.currentUserId && " 🎲"}
          </li>
        ))}
      </Scoreboard>
    </>
  );
};

export default Game;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "board rail"
    "hand rail";
  gap: 0.5rem;
  min-height: 100vh;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "board"
      "rail"
      "hand";
  }
`;

const BoardArea = styled.div`
  grid-area: board;
  min-width: 0;
  display: flex;
  justify-content: center;
`;

const RailArea = styled.div`
  grid-area: rail;
  min-height: 0;
`;

const HandArea = styled.div`
  grid-area: hand;
  min-width: 0;
`;

const Scoreboard = styled.ul`
  list-style: none;
  position: absolute;
  top: 0.5rem;
  right: 340px;
  margin: 1rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.95rem;
  background: rgba(0, 0, 0, 0.5);

  @media (max-width: 720px) {
    position: static;
  }
`;
