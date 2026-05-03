import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { JasonSyncContext } from "./contexts/JasonSyncContext";

// HashRouter-compatible param parsing
const hash = window.location.hash;
const queryString = hash.includes("?") ? hash.split("?")[1] : "";
const params = new URLSearchParams(queryString);

const syncedUser = params.get("user");
const syncedAdmin = params.get("admin") === "true";
const syncedTheme = params.get("theme");
const syncedAvatar = params.get("avatar");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <JasonSyncContext.Provider
      value={{
        user: syncedUser,
        admin: syncedAdmin,
        theme: syncedTheme,
        avatar: syncedAvatar
      }}
    >
      <App />
    </JasonSyncContext.Provider>
  </React.StrictMode>
);