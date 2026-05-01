import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, MessageCircle, Headphones, Users } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/app");
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent/30 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/30 blur-3xl animate-float-slow pointer-events-none" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(var(--aurora-3))]/20 blur-3xl animate-float-slow pointer-events-none" style={{ animationDelay: "6s" }} />

      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-lg">Prism</span>
        </div>
        <Link to="/auth" className="glass rounded-full px-5 py-2 text-sm hover-lift">Sign in</Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-8 animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Liquid glass · macOS feel · Realtime
        </div>
        <h1 className="text-6xl md:text-7xl font-semibold tracking-tight mb-6 animate-fade-in">
          Talk, hang, <span className="bg-gradient-to-r from-primary via-accent to-[hsl(var(--aurora-3))] bg-clip-text text-transparent">vibe</span>.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "100ms" }}>
          A translucent, calm-but-alive space for your group. Spin up a server, drop a code, jump into voice.
        </p>
        <div className="flex items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <Link to="/auth" className="h-12 px-7 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-medium flex items-center shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.5)] hover-lift">
            Get started — it's free
          </Link>
          <a href="#features" className="h-12 px-7 rounded-2xl glass font-medium flex items-center hover-lift">Learn more</a>
        </div>

        <div id="features" className="grid md:grid-cols-3 gap-4 mt-32">
          {[
            { icon: Users, title: "Servers with codes", body: "Create a server, share a 6-char code. Anyone with it joins instantly." },
            { icon: MessageCircle, title: "Realtime chat", body: "Text channels with smooth streaming messages and clean grouping." },
            { icon: Headphones, title: "Voice rooms", body: "Hop in, talk it out. Real WebRTC voice with speaking indicators." },
          ].map((f, i) => (
            <div key={i} className="glass rounded-3xl p-6 text-left hover-lift animate-fade-in" style={{ animationDelay: `${300 + i * 100}ms` }}>
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
