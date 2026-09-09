import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Reset Password — Mafia Mind" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and emits PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Case re-opened.");
      navigate({ to: "/lobby" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.10_0.015_40)_85%)] -z-10" />
      <div className="w-full max-w-md relative">
        <Link
          to="/"
          className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-primary transition-colors font-type text-xs tracking-widest uppercase"
        >
          <Eye className="size-4" /> Mafia Mind
        </Link>

        <div className="bg-card/70 backdrop-blur-md border border-border rounded-sm p-8 shadow-2xl">
          <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-2">
            Case File · Recovery
          </div>
          <h1 className="font-display text-3xl mb-6">Set a new password</h1>

          {!ready ? (
            <p className="text-sm text-muted-foreground">
              Verifying recovery link… If this lingers, request a new link from the sign-in page.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label
                  htmlFor="password"
                  className="font-type text-[10px] tracking-widest uppercase text-muted-foreground"
                >
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 bg-background/60"
                />
              </div>
              <div>
                <Label
                  htmlFor="confirm"
                  className="font-type text-[10px] tracking-widest uppercase text-muted-foreground"
                >
                  Confirm password
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1.5 bg-background/60"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 font-type tracking-widest text-xs uppercase bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Update Password"}
              </Button>
            </form>
          )}

          <Link
            to="/auth"
            className="mt-6 block text-center text-xs font-type tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
