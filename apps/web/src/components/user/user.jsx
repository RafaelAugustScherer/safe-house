import React from "react";
import styled from "styled-components";

const User = ({
  user,
  size = "default" || "smal",
  showLabel,
  index = 1,
  style,
}) => {
  let { username } = user;

  let sizeScale = 1;
  if (size === "small") sizeScale = 0.7;

  let abreviation = username ? username.substring(0, 2) : `J${index + 1}`;

  return (
    <StyledUser scale={sizeScale} title={username} style={style}>
      <span>{abreviation}</span>
      {showLabel && <label>{username || `Jogador ${index + 1}`}</label>}
    </StyledUser>
  );
};

export default User;

const StyledUser = styled.div`
  display: flex;
  align-items: center;
  margin: ${({ scale }) => scale * 0.5}rem;
  background: transparent;
  span {
    width: ${({ scale }) => scale * 2.5}rem;
    height: ${({ scale }) => scale * 2.5}rem;
    border-radius: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.colors.primary};
    text-transform: uppercase;
  }
  label {
    margin-left: ${({ scale }) => scale * 0.5}rem;
  }
`;
