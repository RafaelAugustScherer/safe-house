import React from "react";
import styled from "styled-components";
import { findCardByKey, type AnyCard } from "../../utils";
import ItemCard from "../item-card/item-card";

interface CardHandProps {
  cardKeys: string[];
  selectedKey?: string | null;
  onSelect?: (key: string | null) => void;
  onPlay?: (card: AnyCard) => void;
}

// Click semantics:
//   - first click on a card    -> selects it (rail shows details)
//   - second click on selected -> plays it (existing onPlay flow)
//   - click another card       -> moves selection
const CardHand = ({ cardKeys, selectedKey, onSelect, onPlay }: CardHandProps) => {
  const cards = cardKeys
    .map((k) => findCardByKey(k))
    .filter((c): c is AnyCard => !!c);
  if (cards.length === 0) return null;

  const handleClick = (card: AnyCard, instanceKey: string) => {
    const isSelected = selectedKey === instanceKey;
    if (isSelected && onPlay) {
      onPlay(card);
      return;
    }
    onSelect?.(instanceKey);
  };

  return (
    <HandRow>
      {cards.map((c, i) => {
        const instanceKey = `${c.key}-${i}`;
        const selected = selectedKey === instanceKey;
        const clickable = !!onSelect || !!onPlay;
        return (
          <ItemCard
            key={instanceKey}
            card={c}
            selected={selected}
            clickable={clickable}
            onClick={clickable ? () => handleClick(c, instanceKey) : undefined}
          />
        );
      })}
    </HandRow>
  );
};

export default CardHand;

const HandRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1rem;
  justify-content: center;
`;
