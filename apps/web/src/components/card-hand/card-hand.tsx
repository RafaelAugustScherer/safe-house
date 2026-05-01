import React from "react";
import styled from "styled-components";
import { findCardByKey, type AnyCard } from "../../utils";

interface CardHandProps {
  cardKeys: string[];
  onPlay?: (card: AnyCard) => void;
}

const CardHand = ({ cardKeys, onPlay }: CardHandProps) => {
  const cards = cardKeys.map((k) => findCardByKey(k)).filter((c): c is AnyCard => !!c);
  if (cards.length === 0) return null;
  return (
    <HandRow>
      {cards.map((c, i) => (
        <Card
          key={`${c.key}-${i}`}
          $type={c.type}
          title={c.description}
          onClick={onPlay ? () => onPlay(c) : undefined}
          $clickable={!!onPlay}
        >
          <strong>{c.name}</strong>
          <small>{c.type}</small>
        </Card>
      ))}
    </HandRow>
  );
};

export default CardHand;

const colorByType: Record<string, string> = {
  heal: "#10cc42",
  store: "#10cc42",
  tool: "#10cc42",
  consumable: "#10cc42",
  gun: "#e70000",
  vehicle: "#3a7bd5",
};

const HandRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem;
  justify-content: center;
`;

const Card = styled.div<{ $type: string; $clickable: boolean }>`
  background: ${({ $type }) => colorByType[$type] ?? "#666"};
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  small {
    opacity: 0.7;
    font-size: 0.8rem;
  }
`;
