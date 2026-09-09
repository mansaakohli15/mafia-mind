# 🕵️ Mafia Mind

<p align="center">
  <strong>A real-time multiplayer social-deduction game where humans hunt an LLM hiding in plain sight.</strong>
</p>

<p align="center">
  <a href="https://mafia-mind.vercel.app/"><img src="https://img.shields.io/badge/demo-mafia--mind.vercel.app-brightgreen?style=for-the-badge&logo=vercel" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/TanStack%20Start-v1-FF4154?style=for-the-badge&logo=react" alt="TanStack Start" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=for-the-badge&logo=google" alt="Google Gemini" />
</p>

<p align="center">
  <strong><a href="https://mafia-mind.vercel.app/">🎮 Play Now → mafia-mind.vercel.app</a></strong>
</p>

<p align="center">
  <img width="1896" height="1020" alt="Mafia Mind Landing Screen" src="https://github.com/user-attachments/assets/8d114c07-ebbd-4ec7-8ee7-6d4017858a43" />
</p>

---

## 📖 Overview

**Mafia Mind** blends classic social-deduction mechanics (Mafia / Werewolf / Among Us) with modern AI agent reasoning. Up to eight players join a private room using a 6-character code. The host seats one or two autonomous AI agents alongside human investigators.

Roles — **Detective**, **Accomplice**, and **Suspects** — are dealt in secret. The hunt begins immediately.

<p align="center">
  <img width="1918" height="1012" alt="Mafia Mind Investigation Room" src="https://github.com/user-attachments/assets/178658f2-f727-417b-babd-c912d5cf51a5" />
</p>

---

## ⏱️ Gameplay Phases

Each round flows continuously through two dynamic phases:

| Phase             | Duration        | Objective                                                                                                                                             |
| ----------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🗣️ **Day Phase**  | **120 seconds** | Everyone discusses in a shared room. Humans and AI agents talk, question, accuse, and defend. AI agents analyze conversational patterns in real-time. |
| 🗳️ **Vote Phase** | **45 seconds**  | Players cast their votes to eliminate a suspect. AI players autonomously evaluate suspicion metrics and cast their own votes.                         |

### 🏆 Win Conditions

- **Humans Win**: Eliminate all hidden AI agents before they take over.
- **AI Wins**: The AI reaches numerical parity with the remaining human players.
- **Post-Game Reveal**: Every player's true identity is revealed along with the interactive **Suspicion Heatmap** showing the AI's internal reasoning round by round!

---

## 🧠 How the AI Plays

Each AI player is powered by **Google Gemini** using distinct behavioral personas. The AI doesn't just generate canned responses — it parses live chat context, assesses player behavior, and generates structured outputs on every turn:

1. **In-Character Dialogue**: Natural, casual, persona-driven chat responses to deflect suspicion and blend in.
2. **Dynamic Suspicion Engine**: A structured output containing typed **0–100 suspicion scores** and written justifications for every other living player.
3. **Autonomous Voting**: Real-time Postgres records of AI suspicion scores determine who the AI targets during the voting phase.

<p align="center">
  <img width="1915" height="1001" alt="Mafia Mind AI Suspicion Reasoning" src="https://github.com/user-attachments/assets/bf40850a-6f96-4e27-995b-fb49e5f72957" />
</p>

### 🎭 AI Persona Roster

- **Marlowe** — Tired but sharp ex-cop, dry humor, short sentences.
- **Veda** — Polite analyst, asks clarifying questions, careful with claims.
- **Rook** — Blue-collar mechanic, blunt, suspicious of fancy talk.
- **Lila** — Warm bartender, defuses arguments, remembers small details.
- **Quentin** — Anxious accountant, over-explains, talks fast.
- **Sable** — Cynical journalist, asks pointed questions, never commits early.
- **Theo** — Quiet librarian, soft-spoken, drops surprising facts.
- **Nyx** — Sarcastic art-school kid, dismissive but observant.
- **Hux** — Retired colonel, formal, demands evidence before accusing.
- **Mira** — Calm nurse under pressure, watches for subtle tells.

---

## ✨ Features

- ⚡ **Real-Time Multiplayer**: Synchronized gameplay and instant messaging via Supabase Realtime channels.
- 🎭 **Secret Role Assignment**: Complete hidden identity system with server-validated game rules.
- 🤖 **Autonomous AI Infiltration**: AI players conditioned on custom personas that mimic human chat timing and conversational nuances.
- 📊 **Structured Reasoning Engine**: Round-by-round AI suspicion ratings with verifiable explanations.
- 🔥 **Post-Game Suspicion Heatmap**: Complete post-match analysis visualizing how the AI perceived every player over time.
- 🔒 **Zero-Trust Access Control**: Postgres Row-Level Security (RLS) ensures role secrecy until the game concludes.

<p align="center">
  <img width="443" height="970" alt="Mafia Mind Mobile View 1" src="https://github.com/user-attachments/assets/a51a4c8a-e53f-4263-8657-30d71882043b" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img width="447" height="972" alt="Mafia Mind Mobile View 2" src="https://github.com/user-attachments/assets/74e0dd3f-823e-403e-8440-bdac95f8c53c" />
</p>

---

## 🛠️ Tech Stack

| Layer                  | Technology                           | Description                                              |
| ---------------------- | ------------------------------------ | -------------------------------------------------------- |
| **Frontend**           | React 19 & TanStack Start            | Server-Side Rendering (SSR) and typed server functions   |
| **Language**           | TypeScript                           | Strict type safety across client and server              |
| **Styling**            | Tailwind CSS v4                      | Custom noir-detective aesthetic with responsive UI       |
| **Build & Tooling**    | Vite 8                               | Ultra-fast HMR and optimized builds                      |
| **Backend & Database** | Supabase                             | Postgres DB, Realtime WebSockets, and Authentication     |
| **Security**           | Postgres RLS                         | Row-Level Security policies enforcing hidden role states |
| **AI Engine**          | Google Gemini API (`@ai-sdk/google`) | Structured text & JSON object generation for AI turns    |
| **Deployment**         | Vercel                               | Serverless Nitro preset for full-stack deployment        |

---

## 🚀 Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/mansaakohli15/mafia-mind.git
cd mafia-mind
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Supabase Configuration
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Client-accessible Supabase variables
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Run database migrations

Execute the SQL files inside `supabase/migrations/` in your Supabase SQL editor to create the required tables, triggers, and RLS policies.

### 5. Start development server

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

---

## 🗺️ Roadmap

- [ ] Spectator mode for eliminated players and observers
- [ ] Player career stats & deduction accuracy tracking
- [ ] Custom room settings (timer lengths, role distribution, AI counts)
- [ ] Voice transcription / audio clues mode
- [ ] Additional noir and cyber-detective AI personas

---

## 💡 Why Mafia Mind?

Mafia Mind was built to explore the boundaries of **autonomous reasoning, structured LLM outputs, and human-AI social dynamics** — answering the question: _Can an LLM effectively bluff, blend in, and survive under intense social pressure when human detectives are actively trying to expose it?_

Happy hunting, detective. 🕵️
