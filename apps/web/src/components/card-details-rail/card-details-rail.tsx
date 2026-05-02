import React from "react";
import styled from "styled-components";
import { type AnyCard } from "../../utils";
import ItemCard from "../item-card/item-card";

interface CardDetailsRailProps {
  card: AnyCard | null;
}

const CardDetailsRail = ({ card }: CardDetailsRailProps) => {
  return (
    <Rail>
      <Heading>Detalhes da carta</Heading>
      {card === null ? (
        <Empty>Selecione uma carta para ver os detalhes.</Empty>
      ) : (
        <Body>
          <PreviewWrap>
            <ItemCard card={card} selected size="rail" />
          </PreviewWrap>
          <Section>
            <SectionTitle>Descrição</SectionTitle>
            <p>{card.description}</p>
          </Section>
          <Section>
            <SectionTitle>Propriedades</SectionTitle>
            <PropTable>
              <tbody>
                {propRowsForCard(card).map(({ label, value }) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </PropTable>
          </Section>
        </Body>
      )}
    </Rail>
  );
};

export default CardDetailsRail;

// ----------------------------------------------------------------------------

const yesNo = (b: boolean) => (b ? "Sim" : "Não");

const TYPE_LABEL: Record<string, string> = {
  heal: "Cura",
  store: "Equipamento",
  gun: "Arma",
  vehicle: "Veículo",
  tool: "Ferramenta",
  consumable: "Consumível",
};

const ACTION_LABEL: Record<string, string> = {
  "melee-attack": "Ataque corpo-a-corpo",
  "gun-attack": "Ataque com arma de fogo",
  heal: "Cura",
  upgrade: "Melhoria",
  "open-chest": "Abrir baú",
  movement: "Movimento",
};

const propRowsForCard = (card: AnyCard): { label: string; value: string }[] => {
  const rows: { label: string; value: string }[] = [
    { label: "Tipo", value: TYPE_LABEL[card.type] ?? card.type },
    { label: "Ação", value: ACTION_LABEL[card.cardAction] ?? card.cardAction },
  ];
  if ("normalValue" in card) {
    rows.push({ label: "Valor normal", value: String(card.normalValue) });
    rows.push({ label: "Valor especial", value: String(card.specialValue) });
    rows.push({ label: "Faz barulho", value: yesNo(card.soundPenalty) });
  } else if ("value" in card) {
    rows.push({ label: "Valor", value: String(card.value) });
    rows.push({ label: "Valor especial", value: String(card.specialValue) });
    rows.push({ label: "Para dois", value: yesNo(card.duo) });
    rows.push({ label: "Faz barulho", value: yesNo(card.soundPenalty) });
  }
  return rows;
};

const Rail = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-left: 1px solid ${({ theme }) => theme.colors.gray};
  background: rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  min-width: 0;
`;

const Heading = styled.h2`
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.gray};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray};
  padding-bottom: 0.4rem;
`;

const Empty = styled.p`
  color: ${({ theme }) => theme.colors.gray};
  font-style: italic;
  margin-top: 1rem;
  text-align: center;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
`;

const PreviewWrap = styled.div`
  display: flex;
  justify-content: center;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  p {
    font-size: 0.9rem;
    line-height: 1.35;
  }
`;

const SectionTitle = styled.h3`
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.gray};
`;

const PropTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  th,
  td {
    padding: 0.3rem 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    text-align: left;
  }
  th {
    color: ${({ theme }) => theme.colors.gray};
    font-weight: 500;
    width: 45%;
  }
  td {
    text-align: right;
  }
`;
