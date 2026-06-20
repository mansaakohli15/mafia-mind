# 🕵️ Mafia Mind

**A real-time multiplayer social-deduction game where humans hunt an LLM hiding among them.**

[![Live Demo](https://img.shields.io/badge/demo-mafia--mind.vercel.app-brightgreen)](https://mafia-mind.vercel.app/)
![TanStack Start](https://img.shields.io/badge/TanStack%20Start-v1-FF4154)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3ECF8E)
![Gemini](https://img.shields.io/badge/AI-Gemini%203-4285F4)

**[🎮 Play now → mafia-mind.vercel.app](https://mafia-mind.vercel.app/)**

<img width="1896" height="1020" alt="image" src="https://github.com/user-attachments/assets/8d114c07-ebbd-4ec7-8ee7-6d4017858a43" />

<img width="1918" height="1012" alt="image" src="https://github.com/user-attachments/assets/178658f2-f727-417b-babd-c912d5cf51a5" />

<img width="1915" height="1001" alt="image" src="https://github.com/user-attachments/assets/bf40850a-6f96-4e27-995b-fb49e5f72957" />

---

## Overview

Up to eight players join a six-character room code. The host seats one or two AI agents alongside the humans. Roles — **Detective**, **Accomplice**, **Suspects** — are dealt secretly, and the hunt begins.

Each round runs in two phases:

- 🗣️ **Day Phase (120s)** — everyone chats in a shared room, human and AI alike
- 🗳️ **Vote Phase (45s)** — players vote to eliminate a suspect

The game ends when the AI is lynched (**humans win**) or the AI reaches numerical parity with the remaining humans (**AI wins**). At the end, every role is revealed — and so is the **Suspicion Heatmap**: every score the AI gave every player, every round, with its reasoning laid bare.

---

## How the AI plays

Each AI seat is powered by **Google Gemini 3** via the Lovable AI Gateway, conditioned on one of **ten distinct personas** — think "tired ex-cop" or "sarcastic art-school kid." Personas aren't just flavor text; they shape how the model talks, deflects, and accuses.

On every turn, the model produces two structured outputs:

1. A short, in-character chat message
2. A typed JSON array of **0–100 suspicion scores**, with written reasoning, for every other living player

Those scores are persisted to Postgres and drive the AI's autonomous voting each round — nothing is scripted after the fact.

---

## Features

- ⏱️ Real-time multiplayer gameplay via Supabase Realtime
- 🎭 Hidden roles and elimination mechanics
- 🤖 AI-powered players with distinct, persistent personas
- 🧠 Autonomous AI reasoning and voting
- 📊 Suspicion scoring engine with per-round written explanations
- 🔥 Post-game Suspicion Heatmap visualization
- 🔒 Row-level security — players only ever see their own role and their own room's data; other roles unlock once the game ends, enforced by database triggers (no client-side trust)
<img width="443" height="970" alt="image" src="https://github.com/user-attachments/assets/a51a4c8a-e53f-4263-8657-30d71882043b" />

<img width="447" height="972" alt="image" src="https://github.com/user-attachments/assets/74e0dd3f-823e-403e-8440-bdac95f8c53c" />


---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TanStack Start v1 (SSR, typed server functions) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 — custom noir-detective theme |
| Build tool | Vite 7 |
| Backend / DB | Supabase (Postgres, Realtime, Auth) |
| Access control | Postgres Row-Level Security + triggers |
| AI | Google Gemini 3, via the Lovable AI Gateway |
| Hosting | Vercel (Nitro server functions) |

---

## Gameplay flow

1. **Create or join** a room using a six-character code
2. **Roles are assigned** secretly — Detective, Accomplice, Suspects
3. **Day Phase** — players (and AI agents) discuss for 120 seconds
4. AI agents **analyze the conversation** and generate suspicion scores with reasoning
5. **Vote Phase** — everyone votes to eliminate a suspect, 45 seconds on the clock
6. The game checks win conditions
7. Repeat until **humans eliminate the AI**, or the **AI reaches parity**
8. **End screen**: every role revealed, full Suspicion Heatmap rendered

---

## Local development

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# build for production
npm run build
```

You'll need a Supabase project (Postgres + Realtime enabled) and a Gemini API key  configured as environment variables .

---

## Roadmap

- [ ] Spectator mode
- [ ] Player statistics dashboard
- [ ] Additional AI personas
- [ ] Custom room settings (player count, timer length, role mix)
- [ ] Enhanced moderation tools

---

## Why I built this

Mafia Mind started as an experiment in **autonomous reasoning, structured LLM outputs, and human-AI social interaction** — what happens when an LLM has to bluff, deflect, and build a believable identity under real social pressure, in real time, against people actively trying to catch it out?

Happy hunting, detective. 🕵️
