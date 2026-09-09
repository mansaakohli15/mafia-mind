/**
 * AI Server Functions Module
 *
 * Implements autonomous AI player behaviors for Mafia Mind:
 * 1. triggerAiTurn: Generates conversational responses and calculates live suspicion scores
 *    using Google Gemini models.
 * 2. aiVote: Autonomously casts votes based on aggregated suspicion ratings during the voting phase.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, generateObject } from "ai";
import { getGoogleProvider } from "./gemini.server";

// Default to Gemini 2.5 Flash for low latency and high quality social deduction reasoning
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * Server function to trigger an AI player's chat message and suspicion assessment.
 * Evaluates the current game transcript, applies persona instructions, and writes
 * the generated message and suspicion matrix to Postgres.
 */
export const triggerAiTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ roomId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY)");
    const { supabase } = context;

    const { data: room } = await supabase.from("rooms").select("*").eq("id", data.roomId).single();
    if (!room || room.status !== "day") return { skipped: true };

    // Role is column-restricted from authenticated; read full rows via admin
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: players } = await supabaseAdmin
      .from("room_players")
      .select("*")
      .eq("room_id", data.roomId)
      .order("seat");
    if (!players) return { skipped: true };

    const aliveAIs = players.filter((p) => p.is_ai && p.alive);
    if (aliveAIs.length === 0) return { skipped: true };

    const { data: recent } = await supabase
      .from("messages")
      .select("content, player_id, created_at")
      .eq("room_id", data.roomId)
      .eq("round", room.current_round)
      .order("created_at", { ascending: true });

    if (!recent || recent.length === 0) return { skipped: true };
    // Don't double-speak: skip if last message is from an AI
    const last = recent[recent.length - 1];
    if (aliveAIs.some((a) => a.id === last.player_id)) return { skipped: true };

    const ai = aliveAIs[Math.floor(Math.random() * aliveAIs.length)];
    const nameById = new Map(players.map((p) => [p.id, p.display_name]));
    const transcript = recent
      .map((m) => `${nameById.get(m.player_id) ?? "?"}: ${m.content}`)
      .join("\n");
    const roster = players
      .filter((p) => p.alive && p.id !== ai.id)
      .map((p) => p.display_name)
      .join(", ");

    const roleHint =
      ai.role === "accomplice"
        ? "You are the secret traitor. Subtly deflect suspicion away from yourself and onto others. Never admit anything. Sound human and warm."
        : ai.role === "detective"
          ? "You are the detective. Probe others' inconsistencies but do not reveal your role outright."
          : "You are a regular townsperson trying to find the traitor.";

    const google = getGoogleProvider(key);

    const { text } = await generateText({
      model: google(MODEL),
      system: `You are ${ai.display_name}, a player in a social-deduction game. Persona: ${ai.ai_persona}. ${roleHint}
CRITICAL RULES:
- Reply with ONE short line, 5 to 30 words. Lowercase casual chat style.
- Never mention being an AI, language model, or game system. You are a human player.
- Do not use quote marks.
- Reference at least one other player by name when natural.
- Other players currently alive: ${roster}.`,
      prompt: `Recent table chat (this round ${room.current_round}):\n${transcript}\n\nYour next message as ${ai.display_name}:`,
    });

    const clean = text
      .trim()
      .replace(/^["'`]+|["'`]+$/g, "")
      .slice(0, 280);
    await supabaseAdmin.from("messages").insert({
      room_id: data.roomId,
      player_id: ai.id,
      content: clean,
      phase: "day",
      round: room.current_round,
    });

    // Update suspicion scores asynchronously (fire-and-forget; await for simplicity)
    try {
      const targets = players.filter((p) => p.alive && p.id !== ai.id);
      const { object } = await generateObject({
        model: google(MODEL),
        schema: z.object({
          scores: z.array(
            z.object({
              name: z.string(),
              suspicion: z.number().min(0).max(100),
              reason: z.string().max(160),
            }),
          ),
        }),
        system: `You are ${ai.display_name}, secretly analyzing every other player. Rate how suspicious each player seems on a 0-100 scale. Be decisive — vary the numbers.`,
        prompt: `Players: ${targets.map((t) => t.display_name).join(", ")}\nTranscript:\n${transcript}\n\nReturn one suspicion score per player.`,
      });
      const rows = object.scores
        .map((s) => {
          const t = targets.find((p) => p.display_name.toLowerCase() === s.name.toLowerCase());
          if (!t) return null;
          return {
            room_id: data.roomId,
            round: room.current_round,
            observer_player_id: ai.id,
            target_player_id: t.id,
            score: s.suspicion,
            reasoning: s.reason,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
      if (rows.length) await supabaseAdmin.from("suspicion_scores").insert(rows);
    } catch (e) {
      console.error("suspicion update failed", e);
    }

    return { ok: true };
  });

/**
 * Server function to trigger autonomous AI voting during the voting phase.
 * Evaluates the AI's recorded suspicion scores for this round and votes to eliminate
 * the player with the highest suspicion score.
 */
export const aiVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ roomId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: room } = await supabase.from("rooms").select("*").eq("id", data.roomId).single();
    if (!room || room.status !== "voting") return { skipped: true };
    const { data: players } = await supabase
      .from("room_players")
      .select("*")
      .eq("room_id", data.roomId);
    if (!players) return { skipped: true };
    const ais = players.filter((p) => p.is_ai && p.alive);
    const targets = players.filter((p) => p.alive && !p.is_ai);
    for (const ai of ais) {
      // Use latest suspicion scores; else random
      const { data: scores } = await supabase
        .from("suspicion_scores")
        .select("target_player_id, score")
        .eq("room_id", data.roomId)
        .eq("observer_player_id", ai.id)
        .eq("round", room.current_round);
      let target = targets[Math.floor(Math.random() * targets.length)];
      if (scores && scores.length) {
        const validTargets = scores
          .filter((s) => targets.find((t) => t.id === s.target_player_id))
          .sort((a, b) => Number(b.score) - Number(a.score));
        if (validTargets[0]) {
          const t = targets.find((p) => p.id === validTargets[0].target_player_id);
          if (t) target = t;
        }
      }
      if (!target) continue;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("votes")
        .delete()
        .eq("room_id", data.roomId)
        .eq("round", room.current_round)
        .eq("voter_player_id", ai.id);
      await supabaseAdmin.from("votes").insert({
        room_id: data.roomId,
        round: room.current_round,
        voter_player_id: ai.id,
        target_player_id: target.id,
      });
    }
    return { ok: true };
  });
