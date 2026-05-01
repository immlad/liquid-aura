import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Channel, Server } from "@/types/db";
import { Hash, Volume2, Plus, Copy, Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  server: Server;
  activeChannelId: string | null;
  onSelectChannel: (c: Channel) => void;
}

export const ChannelList = ({ server, activeChannelId, onSelectChannel }: Props) => {
  const { user } = useAuth();
  const isOwner = user?.id === server.owner_id;
  const [channels, setChannels] = useState<Channel[]>([]);
  const [copied, setCopied] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"text" | "voice">("text");
  const [editing, setEditing] = useState(false);
  const [codeDraft, setCodeDraft] = useState(server.join_code);
  const [savingCode, setSavingCode] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("channels").select("*").eq("server_id", server.id).order("position");
    if (data) {
      setChannels(data as Channel[]);
      if (!activeChannelId && data.length) onSelectChannel(data[0] as Channel);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase.channel(`channels:${server.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "channels", filter: `server_id=eq.${server.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server.id]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(server.join_code);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 1600);
  };

  const createChannel = async () => {
    const n = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!n || n.length > 32) { toast.error("Name must be 1–32 chars"); return; }
    const { error } = await supabase.from("channels").insert({
      server_id: server.id, name: n, type: newType, position: channels.length,
    });
    if (error) { toast.error(error.message); return; }
    setNewName(""); setCreateOpen(false);
  };

  const text = channels.filter(c => c.type === "text");
  const voice = channels.filter(c => c.type === "voice");

  return (
    <div className="glass-strong rounded-3xl h-full w-64 flex flex-col p-3 animate-slide-in-right">
      <div className="px-3 py-3 border-b border-border/30 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{server.icon_emoji}</span>
          <h2 className="font-semibold truncate flex-1">{server.name}</h2>
        </div>
        <button onClick={copyCode}
          className="mt-3 w-full glass rounded-xl py-2 px-3 flex items-center justify-between hover-lift group">
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Invite code</div>
            <div className="font-mono text-sm tracking-widest">{server.join_code}</div>
          </div>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-1">
        <ChannelGroup label="Text channels" icon={Hash} items={text} active={activeChannelId} onSelect={onSelectChannel} />
        <ChannelGroup label="Voice channels" icon={Volume2} items={voice} active={activeChannelId} onSelect={onSelectChannel} />
      </div>

      <button onClick={() => setCreateOpen(true)}
        className="mt-2 glass rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-sm hover-lift text-muted-foreground hover:text-foreground">
        <Plus className="h-4 w-4" /> New channel
      </button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-strong border-border/40 rounded-3xl max-w-md">
          <DialogHeader><DialogTitle>Create channel</DialogTitle></DialogHeader>
          <Tabs value={newType} onValueChange={(v) => setNewType(v as "text" | "voice")}>
            <TabsList className="grid grid-cols-2 glass">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
            </TabsList>
            <TabsContent value={newType} className="pt-4 space-y-4">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="channel-name" maxLength={32} className="glass border-border/40" />
              <Button onClick={createChannel} className="w-full bg-gradient-to-r from-primary to-accent">Create</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ChannelGroup = ({ label, icon: Icon, items, active, onSelect }: any) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 mb-1">{label}</div>
    <div className="space-y-0.5">
      {items.map((c: Channel) => (
        <button key={c.id} onClick={() => onSelect(c)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-200 ease-mac ${
            active === c.id ? "glass text-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08)]" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}>
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{c.name}</span>
        </button>
      ))}
    </div>
  </div>
);
