import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AI_PERSONAS = [
  { name: "Marlowe", persona: "tired but sharp ex-cop, dry humor, short sentences" },
  { name: "Veda", persona: "polite analyst, asks lots of clarifying questions, careful with claims" },
  { name: "Rook", persona: "blue-collar mechanic, blunt, suspicious of fancy talk" },
  { name: "Lila", persona: "warm bartender, defuses arguments, remembers small details" },
  { name: "Quentin", persona: "anxious accountant, over-explains, talks fast" },
  { name: "Sable", persona: "cynical journalist, asks pointed questions, never commits to a side" },
  { name: "Theo", persona: "quiet librarian, soft-spoken, drops surprising facts" },
  { name: "Nyx", persona: "sarcastic art-school kid, dismissive but observant" },
  { name: "Hux", persona: "retired colonel, formal, demands evidence before accusing" },
  { name: "Mira", persona: "nurse, calm under pressure, watches for tells" },
];

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export const createRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ aiCount: z.number().min(1).max(2).default(1), maxPlayers: z.number().min(4).max(8).default(6) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
    let code = genCode();
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase.from("rooms").select("id").eq("code", code).maybeSingle();
      if (!existing) break;
      code = genCode();
    }
    const { data: room, error } = await supabase
      .from("rooms")
      .insert({ code, host_id: userId, ai_count: data.aiCount, max_players: data.maxPlayers })
      .select()
      .single();
    if (error) throw error;
    const { error: pe } = await supabase.from("room_players").insert({
      room_id: room.id,
      user_id: userId,
      display_name: profile?.display_name ?? "Host",
      seat: 1,
    });
    if (pe) throw pe;
    return room;
  });

export const joinRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(6).max(6) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const code = data.code.toUpperCase();
    const { data: room, error } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle();
    if (error || !room) throw new Error("Room not found");
    if (room.status !== "lobby") throw new Error("Game already started");
    const { data: players } = await supabase.from("room_players").select("seat, user_id").eq("room_id", room.id);
    if (players?.some((p) => p.user_id === userId)) return room;
    if ((players?.length ?? 0) >= room.max_players) throw new Error("Room full");
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
    const nextSeat = (players?.length ?? 0) + 1;
    const { error: ie } = await supabase.from("room_players").insert({
      room_id: room.id,
      user_id: userId,
      display_name: profile?.display_name ?? "Player",
      seat: nextSeat,
    });
    if (ie) throw ie;
    return room;
  });

export const leaveRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ roomId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("room_players").delete().eq("room_id", data.roomId).eq("user_id", context.userId);
    return { ok: true };
  });

export const startGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ roomId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: room } = await supabase.from("rooms").select("*").eq("id", data.roomId).single();
    if (!room || room.host_id !== userId) throw new Error("Only host can start");
    // Need access to role column for assignment; use admin client (host already verified above)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: humans } = await supabaseAdmin.from("room_players").select("*").eq("room_id", data.roomId).order("seat");
    if (!humans || humans.length < 3) throw new Error("Need at least 3 humans");

    // Add AI players
    const usedSeats = humans.map((h) => h.seat);
    const aiPicks = [...AI_PERSONAS].sort(() => Math.random() - 0.5).slice(0, room.ai_count);
    let seatCursor = humans.length;
    const aiRows = aiPicks.map((ai) => {
      seatCursor += 1;
      return {
        room_id: room.id,
        user_id: null,
        display_name: ai.name,
        is_ai: true,
        ai_persona: ai.persona,
        seat: seatCursor,
      };
    });
    void usedSeats;
    const { data: aiInserted, error: aiErr } = await supabaseAdmin.from("room_players").insert(aiRows).select();
    if (aiErr) throw aiErr;

    // Assign roles: 1 detective, 1 accomplice (traitor), rest suspects
    const all = [...humans, ...(aiInserted ?? [])];
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    const assignments: { id: string; role: "detective" | "accomplice" | "suspect" }[] = [];
    assignments.push({ id: shuffled[0].id, role: "detective" });
    assignments.push({ id: shuffled[1].id, role: "accomplice" });
    for (let i = 2; i < shuffled.length; i++) assignments.push({ id: shuffled[i].id, role: "suspect" });
    for (const a of assignments) {
      await supabaseAdmin.from("room_players").update({ role: a.role }).eq("id", a.id);
    }

    const phaseEnd = new Date(Date.now() + 120_000).toISOString();
    const { error: re } = await supabase
      .from("rooms")
      .update({ status: "day", current_round: 1, phase_ends_at: phaseEnd })
      .eq("id", room.id);
    if (re) throw re;
    return { ok: true };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ roomId: z.string().uuid(), content: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase.from("room_players").select("id, alive").eq("room_id", data.roomId).eq("user_id", userId).maybeSingle();
    if (!me || !me.alive) throw new Error("Cannot speak");
    const { data: room } = await supabase.from("rooms").select("status, current_round").eq("id", data.roomId).single();
    if (!room) throw new Error("No room");
    const { error } = await supabase.from("messages").insert({
      room_id: data.roomId,
      player_id: me.id,
      content: data.content,
      phase: room.status,
      round: room.current_round,
    });
    if (error) throw error;
    return { ok: true };
  });

export const castVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ roomId: z.string().uuid(), targetPlayerId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase.from("room_players").select("id, alive").eq("room_id", data.roomId).eq("user_id", userId).maybeSingle();
    if (!me || !me.alive) throw new Error("Cannot vote");
    const { data: room } = await supabase.from("rooms").select("current_round, status").eq("id", data.roomId).single();
    if (!room || room.status !== "voting") throw new Error("Not voting phase");
    await supabase.from("votes").delete().eq("room_id", data.roomId).eq("round", room.current_round).eq("voter_player_id", me.id);
    const { error } = await supabase.from("votes").insert({
      room_id: data.roomId,
      round: room.current_round,
      voter_player_id: me.id,
      target_player_id: data.targetPlayerId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const advancePhase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ roomId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: room } = await supabase.from("rooms").select("*").eq("id", data.roomId).single();
    if (!room || room.host_id !== userId) throw new Error("Only host");

    if (room.status === "day") {
      const phaseEnd = new Date(Date.now() + 45_000).toISOString();
      await supabase.from("rooms").update({ status: "voting", phase_ends_at: phaseEnd }).eq("id", room.id);
      return { ok: true };
    }

    if (room.status === "voting") {
      // Tally votes for this round
      const { data: votes } = await supabase
        .from("votes")
        .select("target_player_id")
        .eq("room_id", room.id)
        .eq("round", room.current_round);
      const tally: Record<string, number> = {};
      for (const v of votes ?? []) tally[v.target_player_id] = (tally[v.target_player_id] ?? 0) + 1;
      let eliminated: string | null = null;
      let max = 0;
      for (const [pid, n] of Object.entries(tally)) {
        if (n > max) { max = n; eliminated = pid; }
      }
      if (eliminated) {
        await supabase.from("room_players").update({ alive: false }).eq("id", eliminated);
      }
      // Check win condition
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: alive } = await supabaseAdmin.from("room_players").select("id, is_ai, role").eq("room_id", room.id).eq("alive", true);
      const aliveAI = alive?.filter((p) => p.is_ai).length ?? 0;
      const totalAlive = alive?.length ?? 0;
      let ended = false;
      if (aliveAI === 0) ended = true; // humans win
      else if (aliveAI * 2 >= totalAlive) ended = true; // AI wins
      if (ended) {
        await supabase.from("rooms").update({ status: "ended", phase_ends_at: null }).eq("id", room.id);
      } else {
        const phaseEnd = new Date(Date.now() + 120_000).toISOString();
        await supabase
          .from("rooms")
          .update({ status: "day", current_round: room.current_round + 1, phase_ends_at: phaseEnd })
          .eq("id", room.id);
      }
      return { ok: true, eliminated };
    }

    return { ok: true };
  });