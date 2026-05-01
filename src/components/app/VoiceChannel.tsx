import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Channel, Profile } from "@/types/db";
import { Mic, MicOff, PhoneOff, Volume2, Headphones } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props { channel: Channel; }

type PeerInfo = { pc: RTCPeerConnection; stream: MediaStream | null; profile?: Profile };

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

export const VoiceChannel = ({ channel }: Props) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [participants, setParticipants] = useState<Record<string, { profile?: Profile; speaking: boolean }>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, PeerInfo>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});
  const speakingTimersRef = useRef<Record<string, number>>({});

  const cleanup = () => {
    Object.values(peersRef.current).forEach(p => p.pc.close());
    peersRef.current = {};
    Object.values(audioElementsRef.current).forEach(a => { a.pause(); a.srcObject = null; });
    audioElementsRef.current = {};
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setParticipants({});
    setConnected(false);
  };

  useEffect(() => () => cleanup(), []);
  useEffect(() => { cleanup(); /* on channel switch */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  const monitorSpeaking = (userId: string, stream: MediaStream) => {
    try {
      const ac = new AudioContext();
      const src = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        const speaking = avg > 18;
        if (speaking) {
          setParticipants(prev => prev[userId]?.speaking ? prev : ({ ...prev, [userId]: { ...prev[userId], speaking: true } }));
          window.clearTimeout(speakingTimersRef.current[userId]);
          speakingTimersRef.current[userId] = window.setTimeout(() => {
            setParticipants(prev => ({ ...prev, [userId]: { ...prev[userId], speaking: false } }));
          }, 350);
        }
        if (audioElementsRef.current[userId] || userId === user?.id) requestAnimationFrame(tick);
      };
      tick();
    } catch (e) { /* ignore */ }
  };

  const createPeer = async (otherId: string, initiator: boolean) => {
    if (peersRef.current[otherId]) return peersRef.current[otherId].pc;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[otherId] = { pc, stream: null };

    localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current && user) {
        channelRef.current.send({
          type: "broadcast", event: "signal",
          payload: { to: otherId, from: user.id, kind: "ice", data: e.candidate.toJSON() },
        });
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      peersRef.current[otherId].stream = stream;
      let audio = audioElementsRef.current[otherId];
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioElementsRef.current[otherId] = audio;
      }
      audio.srcObject = stream;
      audio.muted = deafened;
      monitorSpeaking(otherId, stream);
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channelRef.current?.send({
        type: "broadcast", event: "signal",
        payload: { to: otherId, from: user!.id, kind: "offer", data: offer },
      });
    }
    return pc;
  };

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (data) setParticipants(prev => ({ ...prev, [id]: { ...prev[id], profile: data as Profile, speaking: prev[id]?.speaking ?? false } }));
  };

  const join = async () => {
    if (!user) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      localStreamRef.current = stream;
      monitorSpeaking(user.id, stream);
    } catch {
      toast.error("Microphone access denied");
      return;
    }
    setConnected(true);
    setParticipants({ [user.id]: { speaking: false } });
    fetchProfile(user.id);

    const ch = supabase.channel(`voice:${channel.id}`, { config: { presence: { key: user.id } } });
    channelRef.current = ch;

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      const ids = Object.keys(state);
      setParticipants(prev => {
        const next: typeof prev = {};
        for (const id of ids) next[id] = prev[id] || { speaking: false };
        return next;
      });
      ids.forEach(id => { if (!participants[id]?.profile) fetchProfile(id); });
    });

    ch.on("presence", { event: "join" }, ({ key }) => {
      if (key === user.id) return;
      // The lower id initiates to avoid duplicate offers
      if (user.id < key) createPeer(key, true);
      fetchProfile(key);
    });

    ch.on("presence", { event: "leave" }, ({ key }) => {
      peersRef.current[key]?.pc.close();
      delete peersRef.current[key];
      const a = audioElementsRef.current[key];
      if (a) { a.pause(); a.srcObject = null; delete audioElementsRef.current[key]; }
      setParticipants(prev => {
        const n = { ...prev }; delete n[key]; return n;
      });
    });

    ch.on("broadcast", { event: "signal" }, async ({ payload }) => {
      if (payload.to !== user.id) return;
      const from = payload.from as string;
      if (payload.kind === "offer") {
        const pc = await createPeer(from, false);
        await pc.setRemoteDescription(payload.data);
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        ch.send({ type: "broadcast", event: "signal", payload: { to: from, from: user.id, kind: "answer", data: ans } });
      } else if (payload.kind === "answer") {
        await peersRef.current[from]?.pc.setRemoteDescription(payload.data);
      } else if (payload.kind === "ice") {
        try { await peersRef.current[from]?.pc.addIceCandidate(payload.data); } catch {}
      }
    });

    await ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") await ch.track({ joined_at: Date.now() });
    });
  };

  const leave = () => { cleanup(); };

  const toggleMute = () => {
    const next = !muted; setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach(t => (t.enabled = !next));
  };
  const toggleDeafen = () => {
    const next = !deafened; setDeafened(next);
    Object.values(audioElementsRef.current).forEach(a => (a.muted = next));
  };

  const list = Object.entries(participants);

  return (
    <div className="flex-1 flex flex-col glass-strong rounded-3xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2">
        <Volume2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">{channel.name}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{list.length} connected</span>
      </div>

      <div className="flex-1 overflow-auto p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
        {list.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground mt-20 animate-fade-in">
            <div className="text-6xl mb-3">🎧</div>
            <p>No one's here yet — be the first.</p>
          </div>
        )}
        {list.map(([id, p]) => (
          <div key={id} className="glass rounded-2xl p-5 flex flex-col items-center gap-3 hover-lift animate-scale-in">
            <div className={`relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-semibold transition-all duration-200 ${p.speaking ? "ring-4 ring-success animate-pulse-ring" : ""}`}>
              {(p.profile?.display_name || "?").charAt(0).toUpperCase()}
              {id === user?.id && muted && (
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-destructive flex items-center justify-center">
                  <MicOff className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
            <div className="text-sm font-medium truncate max-w-full">{p.profile?.display_name || "..."}{id === user?.id && " (you)"}</div>
            {p.speaking && (
              <div className="flex items-end gap-0.5 h-4">
                {[0,1,2,3].map(i => (
                  <div key={i} className="w-1 bg-success rounded-full animate-voice-wave" style={{ animationDelay: `${i * 100}ms`, height: "100%" }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 flex items-center justify-center gap-3">
        {!connected ? (
          <Button onClick={join} className="h-12 px-8 rounded-2xl bg-gradient-to-r from-success to-primary text-white shadow-[0_8px_24px_-4px_hsl(var(--success)/0.5)] hover-lift">
            <Headphones className="h-5 w-5 mr-2" /> Join voice
          </Button>
        ) : (
          <>
            <button onClick={toggleMute} className={`h-12 w-12 rounded-2xl glass flex items-center justify-center hover-lift transition-colors ${muted ? "text-destructive" : "text-foreground"}`}>
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button onClick={toggleDeafen} className={`h-12 w-12 rounded-2xl glass flex items-center justify-center hover-lift transition-colors ${deafened ? "text-destructive" : "text-foreground"}`}>
              <Headphones className="h-5 w-5" />
            </button>
            <button onClick={leave} className="h-12 w-12 rounded-2xl bg-destructive flex items-center justify-center hover-lift text-white">
              <PhoneOff className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
