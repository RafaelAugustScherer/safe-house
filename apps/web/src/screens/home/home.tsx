import React from "react";
import { ButtonLink, Header, Title } from "../../components";
import * as s from "../../styles/global";

const Home = () => {
  return (
    <s.Container>
      <Header />
      <s.Main>
        <Title />
        <s.Grid>
          <ButtonLink href="/rooms">Buscar sala</ButtonLink>
          <ButtonLink href="/new-room">Criar uma sala</ButtonLink>
        </s.Grid>
      </s.Main>
    </s.Container>
  );
};

export default Home;
