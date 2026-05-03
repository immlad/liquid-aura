import { useState } from "react";

interface AdminPanelProps {
  bannedUsers: string[];
  servers: string[];
  globalMessage: string | null;
  onBan: (name: string) => void;
  onUnban: (name: string) => void;
  onSetGlobalMessage: (msg: string) => void;
}

export default function AdminPanel({
  bannedUsers,
  servers,
  globalMessage,
  onBan,
  onUnban,
  onSetGlobalMessage
}: AdminPanelProps) {
  const [banInput, setBanInput] = useState("");
  const [msgInput, setMsgInput] = useState("");

  const handleBan = () => {
    const n = banInput.trim();
    if (!n) return;
    onBan(n);
    setBanInput("");
  };

  const handleUnban = () => {
    const n = banInput.trim();
    if (!n) return;
    onUnban(n);
    setBanInput("");
  };

  const handleSetMessage = () => {
    const m = msgInput.trim();
    onSetGlobalMessage(m || "");
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>

      <section>
        <h3>Global Message</h3>
        <div className="admin-row">
          <input
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            placeholder="Enter global message"
          />
          <button onClick={handleSetMessage}>Set</button>
        </div>
        {globalMessage && (
          <p className="global-msg-preview">
            Current: <strong>{globalMessage}</strong>
          </p>
        )}
      </section>

      <section>
        <h3>Ban / Unban User</h3>
        <div className="admin-row">
          <input
            value={banInput}
            onChange={(e) => setBanInput(e.target.value)}
            placeholder="Username"
          />
          <button onClick={handleBan}>Ban</button>
          <button onClick={handleUnban}>Unban</button>
        </div>

        <h4>Banned Users</h4>
        {bannedUsers.length === 0 && <p className="muted">No banned users.</p>}
        <ul className="admin-list">
          {bannedUsers.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Servers</h3>
        <ul className="admin-list">
          {servers.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}