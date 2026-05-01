import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Sparkles } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  displayName: z.string().trim().min(1).max(40).optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, displayName: mode === "signup" ? displayName : undefined });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Welcome!");
        navigate("/app");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate("/app");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/30 blur-3xl animate-float-slow" style={{ animationDelay: "3s" }} />

      <div className="glass-strong rounded-3xl p-10 w-full max-w-md relative animate-scale-in">
        <div className="flex items-center gap-2 mb-2">
          <div className="traffic-dot bg-[hsl(0_70%_55%)]" />
          <div className="traffic-dot bg-[hsl(45_90%_55%)]" />
          <div className="traffic-dot bg-[hsl(140_60%_50%)]" />
        </div>

        <div className="flex items-center gap-3 mt-8 mb-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.5)]">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Prism</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          {mode === "signin" ? "Sign in to your servers" : "Create your liquid space"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5 animate-fade-in">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="glass border-border/40" maxLength={40} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="glass border-border/40" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="glass border-border/40" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.5)]">
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center">
          {mode === "signin" ? "Need an account? Sign up" : "Already have one? Sign in"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
