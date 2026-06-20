# Mafia Mind

A real-time multiplayer social-deduction game where human players must identify and eliminate an AI agent hiding among them.

## Overview

Mafia Mind combines social deduction, real-time multiplayer gameplay, and large language models. One or more AI agents participate alongside human players, each operating with a unique persona, autonomous reasoning, suspicion tracking, and voting behavior.

Players communicate, debate, and vote to eliminate suspects. Humans win if all AI agents are eliminated. The AI wins if it survives until it reaches parity with the remaining human players.

---

## Features

* Real-time multiplayer gameplay
* Hidden roles and elimination mechanics
* AI-powered players with unique personalities
* Autonomous AI voting system
* Suspicion scoring engine with explanations
* Post-game Suspicion Heatmap visualization
* Supabase Realtime synchronization
* Secure row-level access control (RLS)

---

## Technology Stack

| Layer      | Technology               |
| ---------- | ------------------------ |
| Frontend   | React 19, TanStack Start |
| Language   | TypeScript               |
| Styling    | Tailwind CSS v4          |
| Backend    | Supabase                 |
| Database   | PostgreSQL               |
| Realtime   | Supabase Realtime        |
| AI         | Google Gemini            |
| Build Tool | Vite                     |

---

## Gameplay Flow

1. Create or join a room.
2. Roles are assigned secretly.
3. Players discuss during the Day Phase.
4. AI agents analyze messages and generate suspicion scores.
5. Players vote to eliminate a suspect.
6. The game checks win conditions.
7. The process repeats until either humans or AI win.

---

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

## Future Improvements

* Spectator mode
* Player statistics dashboard
* Additional AI personas
* Custom room settings
* Enhanced moderation tools

---

Built as an experimental multiplayer AI game exploring autonomous reasoning, structured LLM outputs, and human-AI social interaction.
