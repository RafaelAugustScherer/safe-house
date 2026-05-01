import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Title, CardRoom, Button, Header } from "../../components";
import { listRooms, type RoomListItem } from "../../services";
import * as s from "../../styles/global";

const Rooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      listRooms()
        .then((list) => {
          if (alive) setRooms(list);
        })
        .catch(() => undefined);
    };
    refresh();
    // Re-poll the lobby every 2s. A push channel can replace this later.
    const handle = window.setInterval(refresh, 2000);
    return () => {
      alive = false;
      window.clearInterval(handle);
    };
  }, []);

  return (
    <s.Container>
      <Header />
      <s.Main>
        <Title legend="Salas" />
        {rooms.length > 0 ? (
          <div>
            {rooms.map((room) => (
              <CardRoom room={room} key={room.id} />
            ))}
          </div>
        ) : (
          <legend style={{ marginTop: "4rem" }}>
            Não foram encontradas salas
          </legend>
        )}
        <Button
          onClick={() => navigate("/")}
          size="small"
          style={{ marginTop: "40px" }}
        >
          Voltar
        </Button>
      </s.Main>
    </s.Container>
  );
};

export default Rooms;
