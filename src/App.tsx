import { useEffect } from "react";
import "./App.css";
import { useJasonSync } from "./contexts/JasonSyncContext";
import { useJasonSupabaseSync } from "./hooks/useJasonSupabaseSync";
import { Header } from "./components/Header";

export default function App() {
  const { user, admin, theme } = useJasonSync();

  useJasonSupabaseSync();

  useEffect(() => {
    if (!theme) return;
    document.body.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) document.body.classList.remove(cls);
    });
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <div className="app-root">
      <Header />
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
        {/* your existing Liquid Aura layout / routes / channels here */}
        <h1>Liquid Aura</h1>
        <p>Synced with JASON OS.</p>
      </div>
    </div>
  );
}