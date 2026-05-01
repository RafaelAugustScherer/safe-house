import React from "react";
import styled from "styled-components";

interface UserProps {
  user: { username?: string };
  size?: "default" | "small";
  showLabel?: boolean;
  index?: number;
  style?: React.CSSProperties;
}

const User = ({
  user,
  size = "default",
  showLabel,
  index = 1,
  style,
}: UserProps) => {
  const { username } = user;
  const sizeScale = size === "small" ? 0.7 : 1;
  const abreviation = username ? username.substring(0, 2) : `J${index + 1}`;

  return (
    <StyledUser $scale={sizeScale} title={username} style={style}>
      <span>{abreviation}</span>
      {showLabel && <label>{username || `Jogador ${index + 1}`}</label>}
    </StyledUser>
  );
};

export default User;

const StyledUser = styled.div<{ $scale: number }>`
  display: flex;
  align-items: center;
  margin: ${({ $scale }) => $scale * 0.5}rem;
  background: transparent;
  span {
    width: ${({ $scale }) => $scale * 2.5}rem;
    height: ${({ $scale }) => $scale * 2.5}rem;
    border-radius: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.colors.primary};
    text-transform: uppercase;
  }
  label {
    margin-left: ${({ $scale }) => $scale * 0.5}rem;
  }
`;
