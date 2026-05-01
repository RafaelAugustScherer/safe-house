import React from "react";
import { Input, Modal, Button } from "..";

interface RequestUsernameProps {
  oldUsername?: string;
  setUsername: (name: string) => void;
}

const RequestUsername = ({ oldUsername, setUsername }: RequestUsernameProps) => {
  return (
    <Modal>
      <label
        style={{
          width: "80vw",
          maxWidth: "600px",
          textAlign: "center",
          fontSize: "1.5rem",
        }}
      >
        {!oldUsername ? "Antes de começar, c" : "C"}omo você quer ser chamado?
      </label>
      <Input
        placeholder="Apelido"
        style={{ margin: "2rem 0" }}
        id="usr-name-salas"
        name="username"
        defaultValue={oldUsername || ""}
      />
      <Button
        onClick={() => {
          const el = document.getElementById("usr-name-salas") as HTMLInputElement | null;
          const newUsername = el?.value;
          if (newUsername) {
            localStorage.setItem("username", newUsername);
            setUsername(newUsername);
          }
        }}
      >
        Pronto
      </Button>
    </Modal>
  );
};

export default RequestUsername;
