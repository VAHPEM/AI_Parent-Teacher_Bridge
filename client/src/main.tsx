import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app/i18n/index";
import App from "./app/App";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
