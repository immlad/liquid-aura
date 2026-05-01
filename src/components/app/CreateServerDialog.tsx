import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EMOJIS = ["✨", "🌌", "🪐", "🌊", "🔥", "🌸", "🎮", "🎧", "🚀", "🍕", "🦄", "🧊"];

export const CreateServerDialog = ({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (id: string) => void }) => {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) { toast.error("Name must be 1–50 chars"); return; }
    setLoading(true);
    const { data, error } = await supabase.rpc("create_server", { _name: trimmed, _icon: emoji });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Server created");
    setName("");
    onOpenChange(false);
    if (data) onCreated(data as unknown as string);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/40 rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create a server</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`h-10 w-10 rounded-xl text-xl glass hover-lift ${emoji === e ? "ring-2 ring-primary" : ""}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Server name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} maxLength={50} className="glass border-border/40" placeholder="My Cool Server" />
          </div>
          <Button disabled={loading} onClick={submit}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.5)]">
            {loading ? "Creating..." : "Create server"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
