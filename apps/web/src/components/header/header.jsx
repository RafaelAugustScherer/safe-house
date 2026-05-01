import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { RequestUsername, User } from "..";

const Header = () => {
  const [username, setUsername] = useState(false);
  const [usernameModal, setUsernameModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let localUsername = localStorage.getItem("username");
      if (localUsername) setUsername(localUsername);
      else setUsernameModal(true);
    }
  }, []);

  return (
    <>
      {username && (
        <StyledHeader onClick={() => setUsernameModal(true)}>
          <User user={{ username }} style={{ margin: "1rem" }} />
        </StyledHeader>
      )}
      {usernameModal && (
        <RequestUsername
          oldUsername={username}
          setUsername={(newUsername) => {
            setUsername(newUsername);
            setUsernameModal(false);
          }}
        />
      )}
    </>
  );
};

export default Header;

const StyledHeader = styled.header`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
`;
