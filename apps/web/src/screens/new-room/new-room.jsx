import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Button, Title, Input, Header } from "../../components";
import { firebaseCreateRoom } from "../../services";
import * as s from "../../styles/global";
import { getUniqueId } from "../../utils";

const NewRoom = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  let localUsername = localStorage.getItem("username");

  const handleCreateRoom = useCallback(
    async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const { password, password2, name } = Object.fromEntries(formData);
      if (password && password !== password2)
        alert("A duas senhas informadas não são iguais!");
      else {
        setLoading(true);
        let room = {
          maxUsers: 2,
          name,
          owner: localUsername,
          status: "waiting",
        };
        if (password) room.password = password;
        const uid = getUniqueId();
        firebaseCreateRoom(uid, room, () =>
          navigate(`/room/${uid}`, { replace: true })
        )
          .catch((error) => {
            console.log(`CATCH`, error);
            alert("Ocorreu um erro ao tentar criar sua sala!");
          })
          .finally(() => setLoading(false));
      }
    },
    [localUsername, navigate]
  );

  return (
    <s.Container>
      <Header />
      <s.Main>
        <Title legend="Crie uma sala para jogar com os amigos" />
        <Form onSubmit={handleCreateRoom}>
          <label>Nome da sala*</label>
          <Input required name="name" disabled={loading} />
          <label>Senha</label>
          <Input name="password" type="password" disabled={loading} />
          <label>Repita a senha</label>
          <Input name="password2" type="password" disabled={loading} />
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
