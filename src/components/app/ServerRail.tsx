import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Server } from "@/types/db";
import { Plus, LogIn, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreateServerDialog } from "./CreateServerDialog";
import { JoinServerDialog } from "./JoinServerDialog";

interface Props {
  servers: Server[];
  activeServerId: string | null;
  onSelect: (id: string) => void;
  onServersChange: () => void;
}

export const ServerRail = ({ servers, activeServerId, onSelect, onServersChange }: Props) => {
  const { signOut } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-3 glass-strong rounded-3xl h-full w-[78px]">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onSelect("")}
            className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_8px_20px_-4px_hsl(var(--primary)/0.5)] hover-lift"
            aria-label="Home"
          >
            <Sparkles className="h-5 w-5 text-white" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Home</TooltipContent>
      </Tooltip>

      <div className="h-px w-8 bg-border/50 my-1" />

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto items-center w-full">
        {servers.map((s, i) => (
          <Tooltip key={s.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelect(s.id)}
                className={`relative h-12 w-12 rounded-2xl flex items-center justify-center text-xl glass hover-lift transition-all duration-300 ease-mac animate-scale-in ${
                  activeServerId === s.id ? "ring-2 ring-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)]" : ""
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span>{s.icon_emoji || "✨"}</span>
                {activeServerId === s.id && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{s.name}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="h-px w-8 bg-border/50" />

      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => setCreateOpen(true)} className="h-12 w-12 rounded-2xl glass hover-lift flex items-center justify-center text-success">
            <Plus className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Create server</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => setJoinOpen(true)} className="h-12 w-12 rounded-2xl glass hover-lift flex items-center justify-center text-primary">
            <LogIn className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Join with code</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={signOut} className="h-12 w-12 rounded-2xl glass hover-lift flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Sign out</TooltipContent>
      </Tooltip>

      <CreateServerDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => { onServersChange(); onSelect(id); }} />
      <JoinServerDialog open={joinOpen} onOpenChange={setJoinOpen} onJoined={(id) => { onServersChange(); onSelect(id); }} />
    </div>
  );
};
