import React from "react";
import styled from "styled-components";

const Modal = ({ children }) => {
  return (
    <Container>
      <Content>{children}</Content>
    </Container>
  );
};

export default Modal;

const Container = styled.div`
  position: absolute;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  min-width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const Content = styled.div`
  background: black;
  display: flex;
  min-width: 100vw;
  padding: 1rem 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
