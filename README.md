# Mafia Mind

> A real-time, multiplayer social-deduction game where humans hunt an LLM hiding among them.

One seat at the table is filled by an AI agent powered by Gemini 3. It chats in character, scores every player's suspicion level with written reasoning, votes autonomously each round, and tries to survive to the final two. Humans win by lynching it. The AI wins by outlasting them.

**Live:** _publish from Lovable to get your `*.lovable.app` URL_

---

## Why it exists

Most "AI projects" are RAG chatbots. Mafia Mind is built to stress the parts of LLM engineering that actually matter at work:

- **Persona-conditioned generation** — 10 distinct voices, prompt-engineered to stay in character across rounds.
- **Structured output under adversarial pressure** — the AI emits typed JSON (`message`, `suspicion_scores`, `vote_target`) that the game state machine consumes directly.
- **Multi-agent reasoning** — each AI seat independently scores every other player 0–100 with reasoning, persisted to Postgres for a post-game **Suspicion Heatmap**.
- **Real-time backend with RLS** — Supabase Postgres + realtime channels, row-level security so players only see their own role.
- **Game-state machine** — lobby → day → voting → night → end, host-advanced with timers and win-condition checks.

---

## Architecture

<lov-artifact url="/__l5e/documents/MafiaMind_Architecture.mmd" mime_type="text/vnd.mermaid"></lov-artifact>

**Stack:**

| Layer | Tech |
|---|---|
| Framework | TanStack Start v1 (React 19, SSR, server functions) |
| Build | Vite 7 |
| Styling | Tailwind v4, custom noir-detective theme (OKLCH tokens, Playfair Display + Special Elite) |
| Auth + DB | Lovable Cloud (Supabase Postgres + RLS + realtime) |
| LLM | Lovable AI Gateway → Gemini 3 (structured JSON output) |
| Deploy | Lovable (one-click publish to `*.lovable.app`) |

---

## Core mechanics

1. **Lobby.** Host creates a 6-character room code, picks 1–2 AI seats and max players. Up to 8 humans join.
2. **Role deal.** Server randomly assigns 1 Detective, 1 Accomplice (traitor), rest Suspects. AI players get a private persona ("tired ex-cop", "sarcastic art-school kid", etc.).
3. **Day phase (120s).** Everyone chats. The AI generates an in-character reply, then quietly writes a suspicion score (0–100) + reasoning for every other player into Postgres.
4. **Voting phase (45s).** Each player votes someone out. The AI casts its own vote based on its accumulated suspicion scores.
5. **Resolve.** Top-voted player is eliminated. Win checks: all AI dead → humans win; AI ≥ half the table → AI wins. Otherwise, next round.
6. **End screen.** Reveal roles + render the **Suspicion Heatmap** — every AI's score for every player, every round.

---

## Project structure

```
src/
├── routes/
│   ├── __root.tsx                       global layout, fonts, auth listener
│   ├── index.tsx                        landing page
│   ├── auth.tsx                         sign in / sign up
│   └── _authenticated/
│       ├── route.tsx                    integration-managed auth gate
│       ├── lobby.tsx                    create / join room
│       └── room.$code.tsx               game UI + realtime + heatmap
├── lib/
│   ├── game.functions.ts                createRoom, joinRoom, startGame, sendMessage, castVote, advancePhase
│   ├── ai.functions.ts                  generateAITurn, scoreSuspicion, aiVote
│   └── ai-gateway.server.ts             Lovable AI Gateway client (Gemini 3)
├── components/
│   ├── DetectiveMascot.tsx              cursor-tracking SVG mascot
│   ├── PoliceTape.tsx                   police-tape divider
│   └── ui/                              shadcn components
├── integrations/supabase/               auto-generated, do not edit
└── styles.css                           design tokens, noir theme

supabase/migrations/                     schema: rooms, room_players, messages, votes, suspicion_scores
```

---

## Running locally

See **GETTING_STARTED.md** for the full beginner walkthrough (VSCode + GitHub).

```bash
bun install
bun run dev
# open http://localhost:8080
```

No env file to set up — Lovable Cloud writes `.env` for you.

---

## Resume bullets (pick your length)

**One-liner**
> Built **Mafia Mind**, a real-time multi-agent social-deduction game where humans hunt an LLM hiding among them — Gemini 3 via AI gateway, persona-driven prompts, structured suspicion scoring, RLS-secured Postgres with realtime.

**Two-liner**
> Built **Mafia Mind**, a real-time multiplayer game where players must identify an LLM agent disguised as a human teammate across chat, voting, and elimination rounds. Engineered persona-conditioned Gemini 3 prompts with structured JSON output for autonomous voting and a per-round Suspicion Engine (0–100 score + reasoning per player) persisted to Postgres, surfaced as a post-game heatmap.

**Bullet group (resume project section)**
> **Mafia Mind** — Real-time multi-agent social-deduction game · TanStack Start · React 19 · Supabase · Gemini 3
> - Designed and shipped a real-time multiplayer game where 3–8 humans and 1–2 LLM agents play a hidden-role round-based game; AI must stay in character and survive to win.
> - Built a **Suspicion Engine**: each AI seat independently scores every other player 0–100 with written reasoning every turn via structured Gemini 3 output, persisted to Postgres and rendered as a post-game heatmap.
> - Implemented persona-conditioned prompts for 10 distinct AI voices; AI autonomously votes each round based on its own accumulated suspicion scores.
> - Engineered the full stack: TanStack Start SSR, typed `createServerFn` RPCs, Supabase row-level security, realtime channels for chat/votes/phase transitions, custom Tailwind v4 noir-detective theme.

---

## Roadmap

- [ ] Spectator mode for eliminated players
- [ ] Stats page: win-rate vs AI per user
- [ ] Tunable round timers per room
- [ ] More AI personas + per-game persona vetoes
- [ ] Custom domain + share previews

---

Built with [Lovable](https://lovable.dev). Happy hunting, detective.