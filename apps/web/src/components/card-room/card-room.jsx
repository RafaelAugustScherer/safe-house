import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Button } from "..";

const Room = ({
  room: {
    name = "",
    id = 0,
    owner = "",
    users = {},
    maxUsers = 0,
    password = false,
  },
}) => {
  const navigate = useNavigate();

  const handleSelectRoom = useCallback(() => {
    if (password) {
      var informedPassword = prompt("Esta sala tem senha. Qual a senha?");
      if (informedPassword === password) navigate(`/room/${id}`);
      else alert("Senha incorreta");
    } else navigate(`/room/${id}`);
  }, [id, navigate, password]);

  let disabled = Object.entries(users).length === maxUsers;

  return (
    <RoomContainer disabled={disabled}>
      <section>
        <h2>
          {password && "🔒"} {name}
          <label>•</label>
          <label>{`${
            users ? Object.entries(users).length : 0
          } / ${maxUsers}`}</label>
        </h2>
        <p>Criada por {owner}</p>
      </section>
      <Button onClick={handleSelectRoom} size="small" disabled={disabled}>
        Entrar
      </Button>
    </RoomContainer>
  );
};

export default Room;

const RoomContainer = styled.div`
  :not(:first-child) {
    border-top: 1px solid ${({ theme }) => theme.colors.gray};
  }
  display: flex;
  align-items: center;
  padding: 20px 0;
  section {
    flex: 1;
    * {
      color: ${({ disabled, theme }) =>
        disabled ? theme.colors.gray : theme.colors.white};
    }
    h2 {
      display: flex;
      align-items: center;
      label {
        font-size: 1rem;
        margin-left: 10px;
        color: ${({ disabled, theme }) =>
          disabled ? theme.colors.gray : theme.colors.green};
      }
    }
    p {
      font-size: 1rem;
    }
  }
`;
