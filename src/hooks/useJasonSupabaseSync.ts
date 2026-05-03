import { useEffect } from "react";
import { useJasonSync } from "../contexts/JasonSyncContext";
import { supabase } from "../integrations/supabase/client";

export function useJasonSupabaseSync() {
  const { user } = useJasonSync();

  useEffect(() => {
    if (!user) return;

    const email = `${user.toLowerCase()}@jason-os.local`;
    const password = "JASON_OS_BRIDGE_ONLY";

    (async () => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!signInError) return;

      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: user }
        }
      });
    })();
  }, [user]);
}