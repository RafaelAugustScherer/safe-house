import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Header, Title, User } from "../../components";
import {
  exitRoom,
  joinRoom,
  startGame,
  useRoomSnapshot,
  type RoomSnapshotUser,
} from "../../services";
import * as s from "../../styles/global";
import { getUniqueId } from "../../utils";
import Game from "./game";

const Room = () => {
  const navigate = useNavigate();
  const params = useParams();
  const roomId = params.id;

  const [myUserId] = useState<string>(() => getUniqueId());
  const [joined, setJoined] = useState(false);
  const localUsername = localStorage.getItem("username") ?? "Jogador";

  const { snapshot: room, deleted } = useRoomSnapshot(roomId, myUserId);

  // Join the room once after we have the user identity.
  useEffect(() => {
    if (!roomId || joined) return;
    joinRoom({ roomId, userId: myUserId, username: localUsername })
      .then(() => setJoined(true))
      .catch((err) => {
        console.error("[room] join failed", err);
        // Owner-created rooms call createRoom (which auto-joins) before
        // navigating here, so a duplicate join is harmless. Other errors
        // (room full, not found) bounce home.
        const msg = String(err?.message ?? "");
        if (msg !== "ROOM_FULL" && msg !== "ROOM_NOT_FOUND") {
          setJoined(true);
        } else {
          alert("Não foi possível entrar na sala.");
          navigate("/");
        }
      });
  }, [roomId, myUserId, localUsername, joined, navigate]);

  useEffect(() => {
    if (deleted) {
      alert("A sala foi encerrada.");
      navigate("/");
    }
  }, [deleted, navigate]);

  const exitTheGame = useCallback(() => {
    if (!roomId) return;
    exitRoom({ roomId, userId: myUserId }).finally(() => navigate("/"));
  }, [roomId, myUserId, navigate]);

  const users: RoomSnapshotUser[] = useMemo(
    () => (room ? Object.values(room.users) : []),
    [room],
  );
  const isOwner = !!room && room.ownerUserId === myUserId;
  const ready = !!room && users.length === room.maxUsers;

  if (!roomId) return null;

  if (room?.status === "PLAYING") {
    return (
      <s.Container>
        <Header />
        <Game myUserId={myUserId} room={room} roomId={roomId} />
      </s.Container>
    );
  }

  if (room?.status === "FINISHED") {
    const winner = room.userWinner ? room.users[room.userWinner]?.username : "—";
    return (
      <s.Container>
        <Header />
        <s.Main>
          <Title legend={`Vencedor: ${winner}`} title={room.name} />
          <div>
            {users.map((user, i) => (
              <User user={user} key={user.userId} index={i} showLabel />
            ))}
          </div>
          <Button onClick={() => navigate("/")} size="small" style={{ marginTop: "40px" }}>
            Sair
          </Button>
        </s.Main>
      </s.Container>
    );
  }

  return (
    <s.Container>
      <Header />
      <s.Main>
        <Title
          legend={
            !room
              ? "Carregando..."
              : ready
                ? "Pronto para começar!"
                : "Aguardando jogadores..."
          }
          title={room?.name ?? ""}
        />
        <div>
          {users.map((user, i) => (
            <User user={user} key={user.userId} index={i} showLabel />
          ))}
        </div>
        {isOwner && (
          <Button disabled={!ready} onClick={() => startGame(roomId)}>
            Começar!
          </Button>
        )}
        <Button onClick={exitTheGame} size="small" style={{ marginTop: "40px" }}>
          Sair
        </Button>
      </s.Main>
    </s.Container>
  );
};

export default Room;
