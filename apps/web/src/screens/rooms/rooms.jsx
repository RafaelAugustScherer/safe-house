import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import firebase from "firebase/app";
import "firebase/database";
import { Title, CardRoom, Button, Header } from "../../components";
import * as s from "../../styles/global";

const db = firebase.database();

const Rooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);

  const listenRoomsAdded = useCallback(() => {
    db.ref(`rooms/`).on("child_added", (data) => {
      if (data?.val()) {
        setRooms((roomsList) => [
          ...roomsList,
          {
            id: data.key,
            ...data.val(),
          },
        ]);
      }
    });
  }, []);

  const listenRoomsChanged = useCallback(() => {
    db.ref(`rooms/`).on("child_changed", (data) => {
      if (data?.val()) {
        setRooms((roomsList) =>
          roomsList.map((room) =>
            room.id === data.key
              ? {
                  id: data.key,
                  ...data.val(),
                }
              : room
          )
        );
      }
    });
  }, []);

  const listenRoomsRemoved = useCallback(() => {
    db.ref(`rooms/`).on("child_removed", (data) => {
      if (data?.val())
        setRooms((roomsList) =>
          roomsList.filter((room) => room.id !== data.key)
        );
    });
  }, []);

  useEffect(() => {
    listenRoomsAdded();
    listenRoomsChanged();
    listenRoomsRemoved();
  }, [listenRoomsAdded, listenRoomsChanged, listenRoomsRemoved]);

  return (
    <s.Container>
      <Header />
      <s.Main>
        <Title legend="Salas" />
        {rooms && rooms.length > 0 ? (
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
