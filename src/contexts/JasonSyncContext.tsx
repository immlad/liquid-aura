import { createContext, useContext } from "react";

interface JasonSyncData {
  user: string | null;
  admin: boolean;
  theme: string | null;
}

export const JasonSyncContext = createContext<JasonSyncData>({
  user: null,
  admin: false,
  theme: null
});

export const useJasonSync = () => useContext(JasonSyncContext);