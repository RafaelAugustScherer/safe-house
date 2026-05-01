import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Button, Title, Input, Header } from "../../components";
import { createRoom } from "../../services";
import * as s from "../../styles/global";
import { getUniqueId } from "../../utils";

const NewRoom = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const localUsername = localStorage.getItem("username") ?? "Jogador";

  const handleCreateRoom = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const name = String(formData.get("name") ?? "");
      const maxUsers = Number(formData.get("maxUsers") ?? 2);

      setLoading(true);
      try {
        const { roomId } = await createRoom({
          name,
          maxUsers,
          ownerUserId: getUniqueId(),
          ownerUsername: localUsername,
        });
        navigate(`/room/${roomId}`, { replace: true });
      } catch (error) {
        console.error("[new-room]", error);
        alert("Ocorreu um erro ao tentar criar sua sala!");
      } finally {
        setLoading(false);
      }
    },
    [localUsername, navigate],
  );

  return (
    <s.Container>
      <Header />
      <s.Main>
        <Title legend="Crie uma sala para jogar com os amigos" />
        <Form onSubmit={handleCreateRoom}>
          <label>Nome da sala*</label>
          <Input required name="name" disabled={loading} />
          <label>Número máximo de jogadores</label>
          <Input
            name="maxUsers"
            type="number"
            min={2}
            max={5}
            defaultValue={2}
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar Sala"}
          </Button>
        </Form>
        <Button onClick={() => navigate("/")} size="small">
          Voltar
        </Button>
      </s.Main>
    </s.Container>
  );
};

export default NewRoom;

const Form = styled.form`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  max-width: 800px;
  margin-top: 2rem;
  margin-bottom: 1rem;
  input {
    width: 400px;
    max-width: 80vw;
  }
  label {
    line-height: 2rem;
  }
  button {
    margin: 2rem auto 0 auto;
  }
`;
