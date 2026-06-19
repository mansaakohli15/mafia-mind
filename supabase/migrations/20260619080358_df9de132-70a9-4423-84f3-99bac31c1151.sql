
-- 1. Fix self-referential RLS policies on messages and votes
DROP POLICY IF EXISTS "messages insertable by own player" ON public.messages;
CREATE POLICY "messages insertable by own player" ON public.messages
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_players p
    WHERE p.id = messages.player_id
      AND p.room_id = messages.room_id
      AND (p.user_id = auth.uid() OR public.is_room_host(p.room_id))
  )
);

DROP POLICY IF EXISTS "votes insertable by own player" ON public.votes;
CREATE POLICY "votes insertable by own player" ON public.votes
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_players p
    WHERE p.id = votes.voter_player_id
      AND p.room_id = votes.room_id
      AND (p.user_id = auth.uid() OR public.is_room_host(p.room_id))
  )
);

-- 2. Hide secret role column from other players via column-level grant
REVOKE SELECT (role) ON public.room_players FROM authenticated;
GRANT SELECT (id, room_id, user_id, display_name, is_ai, ai_persona, seat, alive, created_at)
  ON public.room_players TO authenticated;

-- 3. RPC to read own role, and to reveal all roles once the room has ended
CREATE OR REPLACE FUNCTION public.my_player_role(_room_id uuid)
RETURNS public.player_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.room_players
  WHERE room_id = _room_id AND user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.room_roles_if_ended(_room_id uuid)
RETURNS TABLE(player_id uuid, role public.player_role)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT rp.id, rp.role
  FROM public.room_players rp
  JOIN public.rooms r ON r.id = rp.room_id
  WHERE rp.room_id = _room_id
    AND r.status = 'ended'
    AND public.is_room_member(_room_id)
$$;

REVOKE EXECUTE ON FUNCTION public.my_player_role(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.room_roles_if_ended(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.my_player_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.room_roles_if_ended(uuid) TO authenticated;

-- 4. Trigger that blocks players from editing protected columns on themselves
CREATE OR REPLACE FUNCTION public.prevent_player_self_privilege()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- service_role / admin calls have no auth.uid(): allow
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  -- room host bypasses (needed for startGame / advancePhase running as host)
  IF public.is_room_host(NEW.room_id) THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
    OR NEW.alive IS DISTINCT FROM OLD.alive
    OR NEW.seat IS DISTINCT FROM OLD.seat
    OR NEW.is_ai IS DISTINCT FROM OLD.is_ai
    OR NEW.ai_persona IS DISTINCT FROM OLD.ai_persona
    OR NEW.room_id IS DISTINCT FROM OLD.room_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Only the room host may modify protected player columns';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS room_players_prevent_self_privilege ON public.room_players;
CREATE TRIGGER room_players_prevent_self_privilege
BEFORE UPDATE ON public.room_players
FOR EACH ROW EXECUTE FUNCTION public.prevent_player_self_privilege();

-- 5. Realtime authorization for private channels (room:<uuid>:*)
DROP POLICY IF EXISTS "mm_realtime_room_members" ON realtime.messages;
CREATE POLICY "mm_realtime_room_members"
ON realtime.messages FOR SELECT TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'room:%' THEN
      public.is_room_member(NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid)
    ELSE true
  END
);
