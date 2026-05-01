import React from "react";
import styled from "styled-components";

const Title = ({ legend, title }) => {
  return (
    <>
      <TitleH1>{title || "Safe House"}</TitleH1>
      <Description>
        {legend || "Uma chance, uma casa. Mas você não está só!"}
      </Description>
    </>
  );
};

export default Title;

const TitleH1 = styled.h1`
  margin: 0;
  font-size: calc(3rem + 3vw);
  color: ${({ theme }) => theme.colors.primary};
  font-family: "Creepster", "Crete Round", cursive, sans-serif !important;
  font-weight: normal;
`;

const Description = styled.p`
  font-size: 1.5rem;
  text-align: center;
  margin-top: 1rem;
`;
