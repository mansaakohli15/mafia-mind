import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { DetectiveMascot } from "@/components/DetectiveMascot";
import { PoliceTape } from "@/components/PoliceTape";
import { Button } from "@/components/ui/button";
import { Eye, Brain, Skull, Vote, KeyRound, Plus } from "lucide-react";
import evidenceBoard from "@/assets/evidence-board.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mafia Mind — Spot the AI Among Us" },
      {
        name: "description",
        content:
          "A real-time social deduction game where one secret player is an AI agent. Lie, accuse, and survive — or be exposed.",
      },
      { property: "og:title", content: "Mafia Mind — Spot the AI Among Us" },
      {
        property: "og:description",
        content:
          "A real-time social deduction game where one secret player is an AI agent.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Evidence-board background, vignetted */}
      <div className="absolute inset-0 -z-10">
        <img
          src={evidenceBoard}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-25"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.10_0.015_40)_85%)] animate-vignette" />
      </div>

      {/* Tungsten lamp glow upper-right — flickers */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[700px] h-[700px] -z-10 animate-flicker">
        <div
          className="w-full h-full rounded-full animate-glow-pulse"
          style={{
            background:
              "radial-gradient(circle, oklch(0.85 0.16 70 / 0.45) 0%, oklch(0.78 0.17 70 / 0.15) 30%, transparent 65%)",
          }}
        />
      </div>

      {/* NAV */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-sm bg-primary/15 border border-primary/40 grid place-items-center">
            <Eye className="size-5 text-primary" strokeWidth={1.5} />
          </div>
          <span className="font-display text-xl tracking-tight">
            Mafia<span className="italic text-primary">Mind</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 font-type text-xs tracking-widest uppercase text-muted-foreground">
          <a href="#how" className="hover:text-primary transition-colors">The Case</a>
          <a href="#roles" className="hover:text-primary transition-colors">Roles</a>
          <a href="#why" className="hover:text-primary transition-colors">Why It Matters</a>
        </nav>
        <Button asChild variant="outline" size="sm" className="font-type tracking-widest text-xs uppercase border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground">
          <Link to="/auth">Sign In</Link>
        </Button>
      </header>

      {/* HERO */}
      <section className="relative z-10 px-6 sm:px-12 pt-12 sm:pt-20 pb-32">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text column */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 border border-accent/40 bg-accent/10 rounded-sm font-type text-[10px] tracking-[0.25em] uppercase text-accent-foreground/90">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              Case File #007 · Classified
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-foreground mb-6">
              One of you <br />
              is <span className="italic text-primary">not</span> human.
            </h1>
            <p className="font-body text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
              A real-time social deduction game where a single AI agent infiltrates your lobby —
              lying, deflecting, and forming alliances. Find it before the bodies pile up.
              Or, if fate deals you the wrong card, <em className="text-foreground/90">become</em> the deceiver.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Button asChild size="lg" className="font-type tracking-widest text-xs uppercase h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_40px_-8px_oklch(0.78_0.17_70/0.6)]">
                <Link to="/lobby">
                  <Plus className="size-4 mr-2" /> Open New Case
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-type tracking-widest text-xs uppercase h-14 px-8 border-foreground/20 hover:bg-foreground/5">
                <Link to="/lobby">
                  <KeyRound className="size-4 mr-2" /> Enter With Code
                </Link>
              </Button>
            </div>

            {/* "Stat" line, typewriter style */}
            <div className="font-type text-xs tracking-wider text-muted-foreground/80 flex flex-wrap gap-x-6 gap-y-2">
              <span><span className="text-primary">94%</span> human detection rate</span>
              <span><span className="text-primary">7.2s</span> avg AI response</span>
              <span><span className="text-primary">8–12</span> players per case</span>
            </div>
          </div>

          {/* Mascot column */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Police tape over the corner */}
            <div className="absolute -top-6 -left-6 right-12 z-20 pointer-events-none">
              <PoliceTape rotate={-4} />
            </div>

            {/* Spotlight backdrop */}
            <div
              className="absolute inset-0 -z-10 animate-glow-pulse"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, oklch(0.78 0.17 70 / 0.2) 0%, transparent 60%)",
              }}
            />

            <DetectiveMascot className="w-[280px] sm:w-[360px] lg:w-[440px] aspect-[5/6] animate-fade-up" />

            {/* Lower police tape */}
            <div className="absolute -bottom-2 -right-8 left-16 z-20 pointer-events-none">
              <PoliceTape rotate={3} text="EVIDENCE · CHAIN OF CUSTODY · CASE 007 · DO NOT TAMPER" />
            </div>
          </div>
        </div>
      </section>

      {/* Police tape banner */}
      <div className="relative z-10 -my-4">
        <PoliceTape rotate={-1.5} text="WARNING · AI IMPOSTER ACTIVE · TRUST NO ONE · WARNING · AI IMPOSTER ACTIVE · TRUST NO ONE" />
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 px-6 sm:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-up">
            <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-4">The Investigation</div>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground">
              Three phases. <span className="italic text-primary">One impostor.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "I", title: "The Briefing", body: "Roles are dealt in secret. Villager, Detective, or Mafia. One seat at the table is filled by an AI agent — even the host doesn't know who.", icon: Eye },
              { n: "II", title: "The Deliberation", body: "Day phase opens. Accuse, defend, alibi, deflect. The AI reads chat history, builds suspicion scores, and adapts its strategy round by round.", icon: Brain },
              { n: "III", title: "The Verdict", body: "Cast your vote. Most-suspected player is eliminated. When the dust settles, see if you correctly identified the machine — or if it walked free.", icon: Vote },
            ].map(({ n, title, body, icon: Icon }, i) => (
              <div
                key={n}
                className="group relative bg-card/60 backdrop-blur-sm border border-border p-8 rounded-sm hover:border-primary/50 transition-all duration-500 animate-fade-up"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {/* Pin */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 size-4 rounded-full bg-accent shadow-[0_2px_6px_rgba(0,0,0,0.6)] ring-2 ring-accent/30" />
                <div className="flex items-baseline justify-between mb-6">
                  <span className="font-display italic text-5xl text-primary/70">{n}</span>
                  <Icon className="size-6 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-3">{title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{body}</p>
                <div className="absolute bottom-3 right-4 font-type text-[10px] tracking-widest text-muted-foreground/40">
                  PHASE_0{n === "I" ? 1 : n === "II" ? 2 : 3}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="relative z-10 px-6 sm:px-12 py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 animate-fade-up">
            <div className="font-type text-[10px] tracking-[0.4em] uppercase text-accent mb-4">The Suspects</div>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-6">
              Who's <span className="italic text-primary">really</span> at the table?
            </h2>
            <p className="font-body text-muted-foreground leading-relaxed mb-6">
              Each player draws a role from the deck. The AI draws too — and plays it
              with conversational memory, role-aware reasoning, and a per-player
              suspicion model that updates every round.
            </p>
            <p className="font-type text-xs tracking-wider text-muted-foreground/70 italic">
              "It blamed me at 11:42. By 11:48 it was defending the same player it accused.
              I should have noticed sooner." — Case Report #003
            </p>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {[
              { role: "Villager", desc: "Find the impostors. Survive the vote.", color: "text-foreground" },
              { role: "Mafia", desc: "Lie convincingly. Eliminate quietly.", color: "text-accent" },
              { role: "Detective", desc: "Investigate one player per night.", color: "text-primary" },
              { role: "?_AI_AGENT", desc: "Any role. No tell. Adapts to you.", color: "text-primary" },
            ].map((r) => (
              <div key={r.role} className="bg-card/50 border border-border p-6 rounded-sm hover:bg-card/80 transition-colors">
                <div className={`font-type text-sm tracking-widest uppercase mb-2 ${r.color}`}>{r.role}</div>
                <div className="font-body text-sm text-muted-foreground">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSER */}
      <section id="why" className="relative z-10 px-6 sm:px-12 py-32 text-center">
        <div className="max-w-3xl mx-auto animate-fade-up">
          <Skull className="size-12 mx-auto mb-8 text-accent/70" strokeWidth={1.2} />
          <h2 className="font-display text-4xl sm:text-6xl text-foreground leading-tight mb-8">
            The most dangerous lie <br />
            is the one that <span className="italic text-primary">sounds</span> human.
          </h2>
          <Button asChild size="lg" className="font-type tracking-widest text-xs uppercase h-14 px-10 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/auth">Begin Interrogation</Link>
          </Button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/40 px-6 sm:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 font-type text-[10px] tracking-[0.25em] uppercase text-muted-foreground/60">
          <div>Mafia Mind · Case File © {new Date().getFullYear()}</div>
          <div className="flex items-center gap-6">
            <Link to="/trust" className="hover:text-primary">Trust &amp; Privacy</Link>
            <span>All Suspects Are Innocent Until Voted Out</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
