import { useEffect } from "react";
import { useJasonSync } from "./contexts/JasonSyncContext";
import "./App.css";

export default function App() {
  const { user, admin, theme } = useJasonSync();

  // Apply synced theme to body
  useEffect(() => {
    if (theme) {
      document.body.classList.forEach(cls => {
        if (cls.startsWith("theme-")) document.body.classList.remove(cls);
      });
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return (
    <div className="app-container">
      {user && (
        <div className="sync-banner">
          <p>Signed in from JASON OS as <strong>{user}</strong></p>
          {admin && <p>You have admin privileges</p>}
          {theme && <p>Theme synced: {theme}</p>}
        </div>
      )}

      {/* Your existing Liquid Aura UI */}
      <div className="app-content">
        <h1>Liquid Aura</h1>
        <p>Your synced chat environment is ready.</p>
      </div>
    </div>
  );
}