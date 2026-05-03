import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { useJasonSync } from "./contexts/JasonSyncContext";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const { user, admin, theme, avatar } = useJasonSync();

  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [servers] = useState<string[]>([
    "Main Hub",
    "Gaming",
    "Chat Lounge",
    "Dev Lab"
  ]);

  useEffect(() => {
    if (!theme) return;
    document.body.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) document.body.classList.remove(cls);
    });
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const isBanned = useMemo(() => {
    if (!user) return false;
    return bannedUsers.includes(user.toLowerCase());
  }, [user, bannedUsers]);

  const handleBan = (name: string) => {
    const n = name.trim().toLowerCase();
    if (!n) return;
    setBannedUsers((prev) =>
      prev.includes(n) ? prev : [...prev, n]
    );
  };

  const handleUnban = (name: string) => {
    const n = name.trim().toLowerCase();
    if (!n) return;
    setBannedUsers((prev) => prev.filter((u) => u !== n));
  };

  const handleSetGlobalMessage = (msg: string) => {
    const m = msg.trim();
    setGlobalMessage(m || null);
  };

  return (
    <div className="app-root">
      {globalMessage && (
        <div className="global-banner">
          {globalMessage}
        </div>
      )}

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
        {isBanned ? (
          <div className="banned-box">
            <h1>Access Restricted</h1>
            <p>You are banned from Liquid Aura.</p>
          </div>
        ) : (
          <>
            <h1>Liquid Aura</h1>
            <p>Synced with JASON OS identity.</p>
          </>
        )}

        {admin && (
          <div className="admin-section">
            <AdminPanel
              bannedUsers={bannedUsers}
              servers={servers}
              globalMessage={globalMessage}
              onBan={handleBan}
              onUnban={handleUnban}
              onSetGlobalMessage={handleSetGlobalMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}