import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { JasonSyncContext } from "./contexts/JasonSyncContext";

// Read sync params from JASON OS
const params = new URLSearchParams(window.location.search);

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