import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createRoom, joinRoom } from "@/lib/game.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetectiveMascot } from "@/components/DetectiveMascot";
import { Eye, Plus, KeyRound, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lobby")({
  head: () => ({ meta: [{ title: "Lobby — Mafia Mind" }] }),
  component: Lobby,
});

function Lobby() {
  const navigate = useNavigate();
  const create = useServerFn(createRoom);
  const join = useServerFn(joinRoom);
  const [code, setCode] = useState("");
  const [aiCount, setAiCount] = useState(1);
  const [loading, setLoading] = useState<"create" | "join" | null>(null);

  async function handleCreate() {
    setLoading("create");
    try {
      const room = await create({ data: { aiCount, maxPlayers: 6 } });
      navigate({ to: "/room/$code", params: { code: room.code } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setLoading(null);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading("join");
    try {
      const room = await join({ data: { code: code.toUpperCase() } });
      navigate({ to: "/room/$code", params: { code: room.code } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setLoading(null);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] -z-10 animate-flicker">
        <div
          className="w-full h-full rounded-full animate-glow-pulse"
          style={{
            background: "radial-gradient(circle, oklch(0.85 0.16 70 / 0.25) 0%, transparent 65%)",
          }}
        />
      </div>

      <header className="flex items-center justify-between px-6 sm:px-12 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-9 rounded-sm bg-primary/15 border border-primary/40 grid place-items-center">
            <Eye className="size-5 text-primary" strokeWidth={1.5} />
          </div>
          <span className="font-display text-xl tracking-tight">
            Mafia<span className="italic text-primary">Mind</span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="font-type tracking-widest text-xs uppercase text-muted-foreground"
        >
          <LogOut className="size-3.5 mr-2" /> Sign out
        </Button>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-12 py-8 grid lg:grid-cols-2 gap-8 items-start">
        <div className="hidden lg:block">
          <DetectiveMascot className="w-full max-w-[380px]" />
          <p className="font-type text-xs tracking-wider text-muted-foreground/70 italic mt-6 max-w-sm">
            "Every game, someone at the table isn't who they say they are. Pull up a chair."
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-card/60 backdrop-blur border border-border rounded-sm p-6 sm:p-8">
            <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-2">
              Operation · 01
            </div>
            <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
              <Plus className="size-5 text-primary" /> Open New Case
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="font-type text-[10px] tracking-widest uppercase text-muted-foreground">
                  AI infiltrators
                </Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAiCount(n)}
                      className={`flex-1 h-10 rounded-sm border font-type text-xs tracking-widest uppercase transition-colors ${aiCount === n ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-foreground/40"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={loading !== null}
                className="w-full h-11 font-type tracking-widest text-xs uppercase bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading === "create" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Open Case File"
                )}
              </Button>
            </div>
          </div>

          <div className="bg-card/60 backdrop-blur border border-border rounded-sm p-6 sm:p-8">
            <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-2">
              Operation · 02
            </div>
            <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
              <KeyRound className="size-5 text-primary" /> Enter With Code
            </h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6),
                  )
                }
                placeholder="A1B2C3"
                className="font-type tracking-[0.4em] text-center text-xl h-14 bg-background/60 uppercase"
                maxLength={6}
              />
              <Button
                type="submit"
                disabled={loading !== null || code.length < 6}
                className="w-full h-11 font-type tracking-widest text-xs uppercase"
                variant="outline"
              >
                {loading === "join" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Enter Investigation"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
