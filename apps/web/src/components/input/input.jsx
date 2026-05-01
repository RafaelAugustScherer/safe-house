import React from "react";
import styled from "styled-components";

const Input = (props) => {
  return <StyledInput {...props} />;
};

export default Input;

const StyledInput = styled.input`
  background: ${({ theme }) => theme.colors.bgDark};
  padding: 1rem 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};
  font-family: "Crete Round", "Creepster", cursive, sans-serif;
  :hover,
  :focus,
  :active {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;
