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
          <button onClick={() => onSetGlobalMessage(msgInput)}>Set</button>
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
          <button onClick={() => onBan(banInput)}>Ban</button>
          <button onClick={() => onUnban(banInput)}>Unban</button>
        </div>

        <h4>Banned Users</h4>
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