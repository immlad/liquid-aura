import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const JoinServerDialog = ({
  open, onOpenChange, onJoined,
}: { open: boolean; onOpenChange: (v: boolean) => void; onJoined: (id: string) => void }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 4 || c.length > 12) { toast.error("Enter a valid code"); return; }
    setLoading(true);
    const { data, error } = await supabase.rpc("join_server_by_code", { _code: c });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Joined!");
    setCode("");
    onOpenChange(false);
    if (data) onJoined(data as unknown as string);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/40 rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Join a server</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="code">Invite code</Label>
            <Input id="code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={12}
              className="glass border-border/40 text-center text-2xl tracking-[0.3em] font-mono uppercase h-14"
              placeholder="ABC123" />
          </div>
          <Button disabled={loading} onClick={submit}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.5)]">
            {loading ? "Joining..." : "Join server"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
