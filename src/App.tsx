import { useEffect } from "react";
import "./App.css";
import { useJasonSync } from "./contexts/JasonSyncContext";

export default function App() {
  const { user, admin, theme, avatar } = useJasonSync();

  useEffect(() => {
    if (!theme) return;
    document.body.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) document.body.classList.remove(cls);
    });
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <div className="app-root">
      <header className="la-header">
        {avatar && <img src={avatar} className="la-avatar" />}
        <div className="la-header-text">
          <div className="la-header-name">{user ?? "Guest"}</div>
          {admin && <div className="la-admin-pill">Admin</div>}
        </div>
      </header>

      {user && (
        <div className="sync-banner">
          <p>
            Signed in from JASON OS as <strong>{user}</strong>
          </p>
          {admin && <p>You have admin privileges.</p>}
          {theme && <p>Theme synced: {theme}</p>}
        </div>
      )}

      <div className="app-content">
        <h1>Liquid Aura</h1>
        <p>Synced with JASON OS identity.</p>
      </div>
    </div>
  );
}