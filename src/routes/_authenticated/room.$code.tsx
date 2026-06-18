import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { startGame, sendMessage, castVote, advancePhase, leaveRoom } from "@/lib/game.functions";
import { triggerAiTurn, aiVote } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Send, Loader2, Crown, Bot, Skull, ShieldAlert, Search, User, LogOut, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type Player = Database["public"]["Tables"]["room_players"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type Vote = Database["public"]["Tables"]["votes"]["Row"];

export const Route = createFileRoute("/_authenticated/room/$code")({
  head: () => ({ meta: [{ title: "Investigation — DeceptionAI" }] }),
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const sendFn = useServerFn(sendMessage);
  const startFn = useServerFn(startGame);
  const voteFn = useServerFn(castVote);
  const advanceFn = useServerFn(advancePhase);
  const leaveFn = useServerFn(leaveRoom);
  const aiTurn = useServerFn(triggerAiTurn);
  const aiVoteFn = useServerFn(aiVote);

  const [userId, setUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const lastAiTrigger = useRef<string | null>(null);
  const lastVotingPhase = useRef<{ status: string; round: number } | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Load user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Load + subscribe
  useEffect(() => {
    let roomId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const { data: r } = await supabase.from("rooms").select("*").eq("code", code.toUpperCase()).maybeSingle();
      if (!r) { toast.error("Room not found"); navigate({ to: "/lobby" }); return; }
      if (cancelled) return;
      roomId = r.id;
      setRoom(r);
      const [{ data: p }, { data: m }, { data: v }] = await Promise.all([
        supabase.from("room_players").select("*").eq("room_id", r.id).order("seat"),
        supabase.from("messages").select("*").eq("room_id", r.id).order("created_at"),
        supabase.from("votes").select("*").eq("room_id", r.id),
      ]);
      if (cancelled) return;
      setPlayers(p ?? []);
      setMessages(m ?? []);
      setVotes(v ?? []);

      channel = supabase.channel(`room:${r.id}:${Math.random().toString(36).slice(2, 8)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${r.id}` },
          (payload) => { if (payload.new) setRoom(payload.new as Room); })
        .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${r.id}` },
          async () => {
            const { data } = await supabase.from("room_players").select("*").eq("room_id", r.id).order("seat");
            setPlayers(data ?? []);
          })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${r.id}` },
          (payload) => setMessages((prev) => [...prev, payload.new as Message]))
        .on("postgres_changes", { event: "*", schema: "public", table: "votes", filter: `room_id=eq.${r.id}` },
          async () => {
            const { data } = await supabase.from("votes").select("*").eq("room_id", r.id);
            setVotes(data ?? []);
          })
        .subscribe();
    })();
    return () => { cancelled = true; if (channel) supabase.removeChannel(channel); void roomId; };
  }, [code, navigate]);

  // Timer tick
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, []);

  // Scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Trigger AI turn after a human message in day phase
  useEffect(() => {
    if (!room || room.status !== "day" || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (lastAiTrigger.current === last.id) return;
    const lastPlayer = players.find((p) => p.id === last.player_id);
    if (!lastPlayer || lastPlayer.is_ai) return;
    lastAiTrigger.current = last.id;
    setTimeout(() => { aiTurn({ data: { roomId: room.id } }).catch(() => {}); }, 1200 + Math.random() * 1800);
  }, [messages, room, players, aiTurn]);

  // When entering voting phase, trigger AI votes once
  useEffect(() => {
    if (!room) return;
    if (room.status === "voting") {
      const key = { status: room.status, round: room.current_round };
      if (lastVotingPhase.current?.status === key.status && lastVotingPhase.current?.round === key.round) return;
      lastVotingPhase.current = key;
      setTimeout(() => { aiVoteFn({ data: { roomId: room.id } }).catch(() => {}); }, 2000);
    }
  }, [room, aiVoteFn]);

  const me = players.find((p) => p.user_id === userId);
  const isHost = room && userId === room.host_id;
  const myVote = me ? votes.find((v) => v.voter_player_id === me.id && v.round === room?.current_round) : null;
  const aliveCount = players.filter((p) => p.alive).length;
  const secondsLeft = room?.phase_ends_at ? Math.max(0, Math.floor((new Date(room.phase_ends_at).getTime() - now) / 1000)) : null;

  // Auto-advance when timer hits 0 (host only)
  useEffect(() => {
    if (!isHost || !room || secondsLeft === null) return;
    if (secondsLeft === 0 && (room.status === "day" || room.status === "voting")) {
      advanceFn({ data: { roomId: room.id } }).catch(() => {});
    }
  }, [secondsLeft, isHost, room, advanceFn]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!room || !input.trim() || busy) return;
    setBusy(true);
    try {
      await sendFn({ data: { roomId: room.id, content: input.trim() } });
      setInput("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Send failed"); }
    finally { setBusy(false); }
  }

  async function handleStart() {
    if (!room) return;
    setBusy(true);
    try { await startFn({ data: { roomId: room.id } }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Start failed"); }
    finally { setBusy(false); }
  }

  async function handleVote(targetId: string) {
    if (!room) return;
    try { await voteFn({ data: { roomId: room.id, targetPlayerId: targetId } }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Vote failed"); }
  }

  async function handleLeave() {
    if (!room) return;
    await leaveFn({ data: { roomId: room.id } });
    navigate({ to: "/lobby" });
  }

  function copyCode() {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!room) {
    return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] -z-10 animate-flicker">
        <div className="w-full h-full rounded-full animate-glow-pulse" style={{ background: "radial-gradient(ellipse, oklch(0.85 0.16 70 / 0.25) 0%, transparent 70%)" }} />
      </div>

      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border/40">
        <Link to="/lobby" className="flex items-center gap-2">
          <Eye className="size-5 text-primary" />
          <span className="font-display text-lg">Deception<span className="italic text-primary">AI</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={copyCode} className="font-type tracking-[0.3em] text-xs uppercase text-muted-foreground hover:text-primary flex items-center gap-2">
            CASE {room.code} {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
          <Button variant="ghost" size="sm" onClick={handleLeave} className="font-type tracking-widest text-xs uppercase text-muted-foreground">
            <LogOut className="size-3.5 mr-1" /> Exit
          </Button>
        </div>
      </header>

      <PhaseBanner room={room} secondsLeft={secondsLeft} />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
        {/* LEFT: chat + table */}
        <section className="space-y-4">
          <PlayerTable players={players} myId={me?.id} room={room} />

          {room.status === "ended" ? (
            <EndScreen players={players} />
          ) : (
            <div className="bg-card/60 backdrop-blur border border-border rounded-sm h-[420px] flex flex-col">
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && room.status === "lobby" && (
                  <p className="font-type text-xs tracking-wider text-muted-foreground/60 italic text-center mt-12">
                    Waiting for the host to start the investigation...
                  </p>
                )}
                {messages.map((m) => {
                  const p = players.find((pl) => pl.id === m.player_id);
                  const mine = p?.user_id === userId;
                  return (
                    <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
                      <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                        <span className="font-type text-[10px] tracking-widest uppercase text-muted-foreground/70 mb-1">
                          {p?.display_name ?? "?"} {p?.is_ai ? "" : ""}
                        </span>
                        <div className={`px-3 py-2 rounded-sm font-body text-sm ${mine ? "bg-primary/20 border border-primary/30 text-foreground" : "bg-card border border-border text-foreground/90"}`}>
                          {m.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(room.status === "day" || room.status === "lobby") && me?.alive && (
                <form onSubmit={handleSend} className="border-t border-border/40 p-3 flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={room.status === "lobby" ? "Lobby is silent until the case opens" : "Speak your mind..."}
                    disabled={room.status === "lobby" || busy}
                    className="bg-background/60"
                    maxLength={500}
                  />
                  <Button type="submit" disabled={room.status === "lobby" || busy || !input.trim()} size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </form>
              )}
              {room.status === "voting" && (
                <VotingPanel players={players} me={me} myVote={myVote?.target_player_id ?? null} onVote={handleVote} />
              )}
            </div>
          )}
        </section>

        {/* RIGHT: sidebar */}
        <aside className="space-y-4">
          {me && room.status !== "lobby" && room.status !== "ended" && (
            <RoleCard player={me} />
          )}

          {room.status === "lobby" && (
            <div className="bg-card/60 backdrop-blur border border-border rounded-sm p-5">
              <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-2">Briefing</div>
              <h3 className="font-display text-xl mb-3">Suspects gathering</h3>
              <p className="font-body text-sm text-muted-foreground mb-4">
                Share the code <span className="font-type text-primary">{room.code}</span> to invite players.
                {room.ai_count} AI infiltrator{room.ai_count > 1 ? "s" : ""} will join when the case opens.
              </p>
              <div className="text-xs font-type tracking-wider text-muted-foreground/70 mb-4">
                {players.length} / {room.max_players} humans · need 3+ to start
              </div>
              {isHost ? (
                <Button onClick={handleStart} disabled={busy || players.length < 3} className="w-full font-type tracking-widest text-xs uppercase bg-primary text-primary-foreground hover:bg-primary/90 h-11">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "Open The Case"}
                </Button>
              ) : (
                <p className="text-xs font-type tracking-wider text-muted-foreground italic">Waiting for host...</p>
              )}
            </div>
          )}

          {isHost && (room.status === "day" || room.status === "voting") && (
            <div className="bg-card/60 backdrop-blur border border-border rounded-sm p-4">
              <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-2">Host Controls</div>
              <Button onClick={() => advanceFn({ data: { roomId: room.id } })} variant="outline" size="sm" className="w-full font-type tracking-widest text-xs uppercase">
                {room.status === "day" ? "End Discussion → Vote" : "Tally Votes"}
              </Button>
            </div>
          )}

          <div className="bg-card/60 backdrop-blur border border-border rounded-sm p-4">
            <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-3">Round Status</div>
            <div className="space-y-2 text-sm font-type">
              <div className="flex justify-between"><span className="text-muted-foreground">Round</span><span>{room.current_round || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Alive</span><span>{aliveCount} / {players.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phase</span><span className="capitalize text-primary">{room.status}</span></div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function PhaseBanner({ room, secondsLeft }: { room: Room; secondsLeft: number | null }) {
  const label = room.status === "lobby" ? "Lobby"
    : room.status === "day" ? `Day ${room.current_round} · Discussion`
    : room.status === "voting" ? `Day ${room.current_round} · Voting`
    : "Case Closed";
  return (
    <div className="border-b border-border/40 bg-card/40 backdrop-blur px-4 sm:px-8 py-3 flex items-center justify-between">
      <div className="font-type text-xs tracking-[0.3em] uppercase text-muted-foreground">{label}</div>
      {secondsLeft !== null && room.status !== "lobby" && room.status !== "ended" && (
        <div className={`font-type text-xs tracking-widest ${secondsLeft < 10 ? "text-destructive animate-pulse" : "text-primary"}`}>
          {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}

function PlayerTable({ players, myId, room }: { players: Player[]; myId?: string; room: Room }) {
  return (
    <div className="bg-card/40 backdrop-blur border border-border rounded-sm p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {players.map((p) => (
          <div key={p.id} className={`relative px-3 py-2 rounded-sm border text-xs font-type ${
            !p.alive ? "border-destructive/30 bg-destructive/5 opacity-50" :
            p.id === myId ? "border-primary/60 bg-primary/10" : "border-border bg-background/40"
          }`}>
            <div className="flex items-center gap-1.5">
              {p.is_ai ? <Bot className="size-3 text-accent" /> : <User className="size-3 text-muted-foreground" />}
              {p.user_id === room.host_id && <Crown className="size-3 text-primary" />}
              {!p.alive && <Skull className="size-3 text-destructive" />}
              <span className="truncate tracking-wider">{p.display_name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleCard({ player }: { player: Player }) {
  const role = player.role;
  const cfg = role === "detective" ? { Icon: Search, label: "Detective", desc: "Find the AI traitor. Survive the vote.", color: "text-primary border-primary/40 bg-primary/10" }
    : role === "accomplice" ? { Icon: ShieldAlert, label: "Accomplice", desc: "Blend in. Mislead. Survive.", color: "text-accent border-accent/40 bg-accent/10" }
    : { Icon: User, label: "Suspect", desc: "Survive. Vote out the traitor.", color: "text-foreground border-border bg-card/60" };
  const { Icon } = cfg;
  return (
    <div className={`backdrop-blur border rounded-sm p-5 ${cfg.color}`}>
      <div className="font-type text-[10px] tracking-[0.4em] uppercase opacity-70 mb-2">Your Role</div>
      <div className="flex items-center gap-3">
        <Icon className="size-8" strokeWidth={1.5} />
        <div>
          <div className="font-display text-2xl">{cfg.label}</div>
          <div className="font-body text-xs opacity-80 mt-0.5">{cfg.desc}</div>
        </div>
      </div>
    </div>
  );
}

function VotingPanel({ players, me, myVote, onVote }: { players: Player[]; me?: Player; myVote: string | null; onVote: (id: string) => void }) {
  const targets = players.filter((p) => p.alive && p.id !== me?.id);
  return (
    <div className="border-t border-border/40 p-4">
      <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-3">Cast Your Vote</div>
      {!me?.alive ? (
        <p className="text-xs text-muted-foreground italic">You were eliminated. Watch the case unfold.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {targets.map((p) => (
            <button key={p.id} onClick={() => onVote(p.id)}
              className={`px-3 py-2 rounded-sm border text-xs font-type tracking-wider transition-all ${
                myVote === p.id ? "border-primary bg-primary/20 text-primary" : "border-border hover:border-foreground/40"
              }`}>
              {p.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EndScreen({ players }: { players: Player[] }) {
  const aliveAI = players.filter((p) => p.is_ai && p.alive).length;
  const humansWin = aliveAI === 0;
  return (
    <div className="bg-card/60 backdrop-blur border border-border rounded-sm p-8 text-center">
      <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-3">Case Closed</div>
      <h2 className="font-display text-4xl mb-4">
        {humansWin ? <>The humans <span className="italic text-primary">prevailed</span></> : <>The AI <span className="italic text-accent">walked free</span></>}
      </h2>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md mx-auto">
        {players.map((p) => (
          <Badge key={p.id} variant="outline" className="justify-start gap-2 px-3 py-2 font-type text-xs">
            {p.is_ai ? <Bot className="size-3 text-accent" /> : <User className="size-3" />}
            <span className="truncate">{p.display_name}</span>
            <span className="ml-auto text-[10px] uppercase opacity-60">{p.role}</span>
          </Badge>
        ))}
      </div>
      <Link to="/lobby" className="inline-block mt-8 font-type tracking-widest text-xs uppercase text-primary hover:underline">
        ← Back to Lobby
      </Link>
    </div>
  );
}