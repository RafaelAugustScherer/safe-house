import React from "react";
import styled from "styled-components";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "small";
}

const Button = ({ children, size = "default", ...rest }: ButtonProps) => {
  const sizeScale = size === "small" ? 0.7 : 1;
  return (
    <StyledButton {...rest} $scale={sizeScale}>
      {children}
    </StyledButton>
  );
};

export default Button;

const StyledButton = styled.button<{ $scale: number }>`
  margin: ${({ $scale }) => $scale * 1}rem;
  padding: ${({ $scale }) => $scale * 1}rem ${({ $scale }) => $scale * 1.5}rem;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  transition: all 0.2s ease;
  font-size: ${({ $scale }) => $scale * 1}rem;
  background: ${({ theme }) => theme.colors.bgDark};
  color: ${({ theme }) => theme.colors.text};
  text-transform: uppercase;
  :hover,
  :focus,
  :active {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
  :disabled {
    background: ${({ theme }) => theme.colors.bgDark} !important;
    border-color: ${({ theme }) => theme.colors.gray} !important;
    cursor: not-allowed !important;
    opacity: 0.5;
  }
`;
