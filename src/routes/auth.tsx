import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign In — Mafia Mind" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/lobby" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: window.location.origin + "/lobby",
          },
        });
        if (error) throw error;
        toast.success("Case file opened. Welcome, detective.");
        navigate({ to: "/lobby" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/lobby" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function googleSignIn() {
    setLoading(true);
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/lobby" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-32 -right-32 w-[700px] h-[700px] -z-10 animate-flicker">
        <div className="w-full h-full rounded-full animate-glow-pulse" style={{ background: "radial-gradient(circle, oklch(0.85 0.16 70 / 0.35) 0%, transparent 65%)" }} />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.10_0.015_40)_85%)] -z-10" />

      <div className="w-full max-w-md relative">
        <Link to="/" className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-primary transition-colors font-type text-xs tracking-widest uppercase">
          <Eye className="size-4" /> Mafia Mind
        </Link>

        <div className="bg-card/70 backdrop-blur-md border border-border rounded-sm p-8 shadow-2xl">
          <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-2">Case File · Access</div>
          <h1 className="font-display text-3xl mb-6">
            {mode === "signin" ? "Sign in to investigate" : "Open a new case file"}
          </h1>

          <Button
            type="button"
            variant="outline"
            onClick={googleSignIn}
            disabled={loading}
            className="w-full h-11 mb-4 font-type tracking-widest text-xs uppercase border-foreground/20 hover:bg-foreground/5"
          >
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-border flex-1" />
            <span className="font-type text-[10px] tracking-widest uppercase text-muted-foreground">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name" className="font-type text-[10px] tracking-widest uppercase text-muted-foreground">Code name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Det. Marlowe" className="mt-1.5 bg-background/60" />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="font-type text-[10px] tracking-widest uppercase text-muted-foreground">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 bg-background/60" />
            </div>
            <div>
              <Label htmlFor="password" className="font-type text-[10px] tracking-widest uppercase text-muted-foreground">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 bg-background/60" />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 font-type tracking-widest text-xs uppercase bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? <Loader2 className="size-4 animate-spin" /> : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-xs font-type tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            {mode === "signin" ? "No file yet? Open a new case." : "Already on the force? Sign in."}
          </button>
        </div>
      </div>
    </div>
  );
}