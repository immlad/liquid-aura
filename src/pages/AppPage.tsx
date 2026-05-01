import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Channel, Server } from "@/types/db";
import { ServerRail } from "@/components/app/ServerRail";
import { ChannelList } from "@/components/app/ChannelList";
import { TextChannel } from "@/components/app/TextChannel";
import { VoiceChannel } from "@/components/app/VoiceChannel";
import { Sparkles } from "lucide-react";

const AppPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const loadServers = async () => {
    const { data } = await supabase.from("servers").select("*").order("created_at");
    if (data) {
      setServers(data as Server[]);
      if (!activeServerId && data.length) setActiveServerId((data[0] as Server).id);
    }
  };

  useEffect(() => { if (user) loadServers(); /* eslint-disable-next-line */ }, [user]);

  // Live updates when a server changes (e.g. invite code edited) or membership changes
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("servers-and-members")
      .on("postgres_changes", { event: "*", schema: "public", table: "servers" }, () => loadServers())
      .on("postgres_changes", { event: "*", schema: "public", table: "server_members", filter: `user_id=eq.${user.id}` }, () => loadServers())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reset channel when switching servers
  useEffect(() => { setActiveChannel(null); }, [activeServerId]);

  const activeServer = servers.find(s => s.id === activeServerId) || null;

  if (loading || !user) {
    return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="h-screen w-screen p-3 flex gap-3 relative overflow-hidden">
      {/* Floating aurora orbs */}
      <div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl animate-float-slow pointer-events-none" style={{ animationDelay: "4s" }} />

      <ServerRail
        servers={servers}
        activeServerId={activeServerId}
        onSelect={(id) => setActiveServerId(id || null)}
        onServersChange={loadServers}
      />

      {activeServer ? (
        <>
          <ChannelList
            server={activeServer}
            activeChannelId={activeChannel?.id ?? null}
            onSelectChannel={setActiveChannel}
          />
          {activeChannel ? (
            activeChannel.type === "voice"
              ? <VoiceChannel channel={activeChannel} />
              : <TextChannel channel={activeChannel} />
          ) : (
            <div className="flex-1 glass-strong rounded-3xl flex items-center justify-center text-muted-foreground">
              Select a channel
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 glass-strong rounded-3xl flex flex-col items-center justify-center text-center p-12 animate-fade-in">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.5)] animate-scale-in">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Welcome to Prism</h1>
          <p className="text-muted-foreground max-w-md">
            Create a server or join one with a code from the rail on the left. Then hop into a text or voice channel.
          </p>
        </div>
      )}
    </div>
  );
};

export default AppPage;
