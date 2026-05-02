import React from "react";
import styled, { css } from "styled-components";
import { type AnyCard, type CardType } from "../../utils";
import { getItemIcon } from "../../assets/items";

export type ItemCardSize = "hand" | "rail";

interface ItemCardProps {
  card: AnyCard;
  selected?: boolean;
  clickable?: boolean;
  size?: ItemCardSize;
  onClick?: () => void;
}

const ItemCard = ({
  card,
  selected = false,
  clickable = false,
  size = "hand",
  onClick,
}: ItemCardProps) => {
  const Icon = getItemIcon(card.key);
  const badge = badgeFor(card);
  return (
    <Card
      $type={card.type}
      $selected={selected}
      $clickable={clickable}
      $size={size}
      onClick={clickable ? onClick : undefined}
      aria-pressed={clickable ? selected : undefined}
    >
      {badge !== null && <CostBadge>{badge}</CostBadge>}
      <NameBanner>{card.name}</NameBanner>
      <ArtPanel $type={card.type}>
        <Icon width="100%" height="100%" />
      </ArtPanel>
      <TypePill>{labelForType(card.type)}</TypePill>
      <Description>{card.description}</Description>
    </Card>
  );
};

export default ItemCard;

// ----------------------------------------------------------------------------

const badgeFor = (card: AnyCard): number | null => {
  if ("normalValue" in card) return card.normalValue;
  if ("value" in card) return card.value;
  return null;
};

const TYPE_LABEL_PT: Record<CardType, string> = {
  heal: "Cura",
  store: "Equipamento",
  gun: "Arma",
  vehicle: "Veículo",
  tool: "Ferramenta",
  consumable: "Consumível",
};

const labelForType = (t: CardType): string => TYPE_LABEL_PT[t] ?? t;

const colorByType: Record<CardType, string> = {
  heal: "#10cc42",
  store: "#10cc42",
  tool: "#10cc42",
  consumable: "#10cc42",
  gun: "#e70000",
  vehicle: "#3a7bd5",
};

const accentForType = (t: CardType): string => colorByType[t] ?? "#666";

const sizeStyles = {
  hand: css`
    width: 140px;
    min-height: 200px;
    font-size: 0.78rem;
  `,
  rail: css`
    width: 100%;
    max-width: 260px;
    min-height: 340px;
    font-size: 0.95rem;
  `,
};

const Card = styled.div<{
  $type: CardType;
  $selected: boolean;
  $clickable: boolean;
  $size: ItemCardSize;
}>`
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  background: #1c1c1c;
  border: 2px solid ${({ $type }) => accentForType($type)};
  border-radius: 8px;
  color: white;
  padding: 6px;
  gap: 4px;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  transition: transform 120ms ease, box-shadow 120ms ease;
  ${({ $size }) => sizeStyles[$size]}
  ${({ $selected, $type }) =>
    $selected &&
    css`
      transform: translateY(-6px);
      box-shadow: 0 0 0 2px ${accentForType($type)},
        0 8px 18px rgba(0, 0, 0, 0.5);
    `}
  &:hover {
    ${({ $clickable }) =>
      $clickable &&
      css`
        transform: translateY(-4px);
      `}
  }
`;

const CostBadge = styled.div`
  position: absolute;
  top: -10px;
  left: -10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e08a1a;
  color: #1c1c1c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1em;
  border: 2px solid #1c1c1c;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
`;

const NameBanner = styled.div`
  text-align: center;
  font-weight: 700;
  font-size: 1em;
  padding: 2px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  line-height: 1.15;
`;

const ArtPanel = styled.div<{ $type: CardType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    160deg,
    ${({ $type }) => accentForType($type)} 0%,
    rgba(0, 0, 0, 0.6) 100%
  );
  color: white;
  border-radius: 4px;
  padding: 8px;
  aspect-ratio: 1.4 / 1;
  min-height: 0;
`;

const TypePill = styled.div`
  align-self: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Description = styled.p`
  font-size: 0.85em;
  line-height: 1.25;
  text-align: center;
  padding: 0 2px 2px;
  color: rgba(255, 255, 255, 0.85);
`;
