import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Button } from "..";
import type { RoomListItem } from "../../services";

interface CardRoomProps {
  room: RoomListItem;
}

const CardRoom = ({ room }: CardRoomProps) => {
  const navigate = useNavigate();
  const { id, name, currentUsers, maxUsers, ownerUserId } = room;

  const handleSelectRoom = useCallback(() => {
    navigate(`/room/${id}`);
  }, [id, navigate]);

  const disabled = currentUsers >= maxUsers;

  return (
    <RoomContainer $disabled={disabled}>
      <section>
        <h2>
          {name}
          <label>•</label>
          <label>{`${currentUsers} / ${maxUsers}`}</label>
        </h2>
        <p>Sala: {ownerUserId.slice(0, 8)}</p>
      </section>
      <Button onClick={handleSelectRoom} size="small" disabled={disabled}>
        Entrar
      </Button>
    </RoomContainer>
  );
};

export default CardRoom;

const RoomContainer = styled.div<{ $disabled: boolean }>`
  :not(:first-child) {
    border-top: 1px solid ${({ theme }) => theme.colors.gray};
  }
  display: flex;
  align-items: center;
  padding: 20px 0;
  section {
    flex: 1;
    * {
      color: ${({ $disabled, theme }) =>
        $disabled ? theme.colors.gray : theme.colors.white};
    }
    h2 {
      display: flex;
      align-items: center;
      label {
        font-size: 1rem;
        margin-left: 10px;
        color: ${({ $disabled, theme }) =>
          $disabled ? theme.colors.gray : theme.colors.green};
      }
    }
    p {
      font-size: 1rem;
    }
  }
`;
