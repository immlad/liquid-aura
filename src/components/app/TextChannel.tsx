import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Channel, Message, Profile } from "@/types/db";
import { Hash, Send, Smile } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props { channel: Channel; }

export const TextChannel = ({ channel }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadProfiles = async (userIds: string[]) => {
    const need = userIds.filter(id => !profiles[id]);
    if (!need.length) return;
    const { data } = await supabase.from("profiles").select("*").in("id", need);
    if (data) {
      setProfiles(prev => {
        const next = { ...prev };
        for (const p of data as Profile[]) next[p.id] = p;
        return next;
      });
    }
  };

  useEffect(() => {
    setMessages([]);
    let ignore = false;
    (async () => {
      const { data } = await supabase.from("messages").select("*").eq("channel_id", channel.id)
        .order("created_at", { ascending: true }).limit(200);
      if (ignore || !data) return;
      setMessages(data as Message[]);
      await loadProfiles(Array.from(new Set((data as Message[]).map(m => m.user_id))));
    })();

    const ch = supabase.channel(`messages:${channel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channel.id}` },
        async (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => [...prev, msg]);
          await loadProfiles([msg.user_id]);
        })
      .subscribe();
    return () => { ignore = true; supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !user || content.length > 2000) return;
    setInput("");
    const { error } = await supabase.from("messages").insert({ channel_id: channel.id, user_id: user.id, content });
    if (error) console.error(error);
  };

  return (
    <div className="flex-1 flex flex-col glass-strong rounded-3xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2">
        <Hash className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">{channel.name}</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-20 animate-fade-in">
            <div className="text-5xl mb-3">💬</div>
            <p>This is the start of #{channel.name}</p>
          </div>
        )}
        {messages.map((m, i) => {
          const p = profiles[m.user_id];
          const prev = messages[i - 1];
          const grouped = prev && prev.user_id === m.user_id && (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60_000);
          return (
            <div key={m.id} className={`animate-fade-in ${grouped ? "pl-12" : ""}`}>
              {!grouped && (
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold">
                    {(p?.display_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm">{p?.display_name || "..."}</span>
                  <span className="text-[11px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}
              <div className={`text-sm leading-relaxed ${grouped ? "" : "pl-12"} text-foreground/90 break-words`}>
                {m.content}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="p-4">
        <div className="glass rounded-2xl flex items-center px-4 py-2.5 gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/50">
          <Smile className="h-5 w-5 text-muted-foreground" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message #${channel.name}`}
            maxLength={2000}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <button type="submit" disabled={!input.trim()} className="text-primary disabled:text-muted-foreground hover:scale-110 transition-transform duration-200">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
