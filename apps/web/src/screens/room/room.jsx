import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import firebase from "firebase/app";
import "firebase/database";
import { Button, Header, Title, User } from "../../components";
import {
  firebaseEnterTheRoom,
  firebaseExitTheRoom,
  firebaseGameRulesStart,
  firebaseStartGame,
} from "../../services";
import * as s from "../../styles/global";
import { getUniqueId } from "../../utils";
import Game from "./game";

const db = firebase.database();

const Room = () => {
  const navigate = useNavigate();

  const [room, setRoom] = useState({});
  const [owner, setOwner] = useState(false);
  const [myUserId, setMyUserId] = useState(false);
  let { id } = useParams();
  let localUsername = localStorage.getItem("username");
  let users = room?.users
    ? Object.entries(room.users).map((array) => ({
        id: array[0],
        ...array[1],
      }))
    : [];
  let already = users.length === room.maxUsers;

  const listenTheGame = useCallback(
    (roomId, userId) => {
      var roomRef = db.ref(`rooms/${roomId}`);
      roomRef.on("value", (data) => {
        let roomData = data.val();
        if (roomData) setRoom({ ...roomData, roomId });
        else {
          alert("Conexão perdida!");
          navigate("/");
        }
      });
      if (roomId === userId) firebaseGameRulesStart(roomId);
    },
    [navigate]
  );

  const enterTheGame = useCallback(
    (roomId) => {
      let userId = getUniqueId();
      setMyUserId(userId);
      if (userId === roomId) setOwner(true);
      firebaseEnterTheRoom(roomId, userId, localUsername).catch((error) => {
        console.log(`CATCH`, error);
        alert("Ocorreu um erro ao tentar entrar na sala!");
      });
      listenTheGame(roomId, userId);
    },
    [listenTheGame, localUsername]
  );

  const exitTheGame = useCallback(() => {
    firebaseExitTheRoom(id, myUserId).then(() => navigate("/"));
  }, [id, myUserId, navigate]);

  useEffect(() => {
    if (id) enterTheGame(id);
  }, [id, enterTheGame]);

  return (
    <s.Container>
      <Header />
      {room.status === "playing" ? (
        <Game myUserId={myUserId} room={room} roomId={id} />
      ) : room.status === "finished" ? (
        <s.Main>
          <Title legend={`Vencedor: ${room?.userWinner}`} title={room.name} />
          <div>
            {users &&
              users.map((user, i) => (
                <User user={user} key={user.id} index={i} showLabel />
              ))}
          </div>
          <Button
            onClick={() => navigate("/")}
            size="small"
            style={{ marginTop: "40px" }}
          >
            Sair
          </Button>
        </s.Main>
      ) : (
        <s.Main>
          <Title
            legend={
              !room
                ? "Carregando..."
                : already
                ? "Pronto para começar!"
                : "Aguardando jogadores..."
            }
            title={room.name}
          />
          <div>
            {users &&
              users.map((user, i) => (
                <User user={user} key={user.id} index={i} showLabel />
              ))}
          </div>
          {owner && (
            <Button disabled={!already} onClick={() => firebaseStartGame(id)}>
              Começar!
            </Button>
          )}
          <Button
            onClick={exitTheGame}
            size="small"
            style={{ marginTop: "40px" }}
          >
            Sair
          </Button>
        </s.Main>
      )}
    </s.Container>
  );
};

export default Room;
