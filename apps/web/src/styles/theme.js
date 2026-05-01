import { createGlobalStyle } from "styled-components";

export const THEME = {
  colors: {
    primary: "#e70000",
    secondary: "#7d7e73",
    bgDark: "#292929",
    gray: "rgb(201, 201, 201)",
    green: "#10cc42",
    text: "white",
  },
};

export const GlobalStyle = createGlobalStyle`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: "Crete Round", "Creepster", cursive, sans-serif !important;
      outline-color: ${THEME.colors.primary};
    }
  
    html,
    body, #root {
      background-color: ${THEME.colors.bgDark};
      color: ${THEME.colors.text};
      height: 100%;
    }
  
    @media (max-width: 1088px) {
      html {
        font-size: 93.75%;
        /* 16px * 0,9375 = 15px */
      }
    } 
    @media (max-width: 720px) {
      html {
        font-size: 87.5%;
        /* 16px * 0,875 = 14px */
      }
    }
  
    body,
    input,
    textarea,
    button {
      font-family: "Crete Round", "Creepster", cursive, sans-serif;
      font: 400 1rem ${THEME.colors.text};
    }
  
  
    button {
      cursor: pointer;
    }
  
    a {
      color: inherit;
      text-decoration: none;
    }
  `;
