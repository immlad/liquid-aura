import { useJasonSync } from "../contexts/JasonSyncContext";

export function Header() {
  const { user, admin, avatar } = useJasonSync();

  return (
    <header className="la-header">
      {avatar && <img src={avatar} className="la-avatar" />}
      <div className="la-header-text">
        <div className="la-header-name">
          {user ?? "Guest"}
        </div>
        {admin && <div className="la-admin-pill">Admin</div>}
      </div>
    </header>
  );
}