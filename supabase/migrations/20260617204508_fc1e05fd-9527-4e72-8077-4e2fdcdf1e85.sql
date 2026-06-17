
-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- =========== ROOMS ===========
CREATE TYPE public.room_status AS ENUM ('lobby','day','night','voting','ended');
CREATE TYPE public.player_role AS ENUM ('detective','suspect','accomplice','unassigned');

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.room_status NOT NULL DEFAULT 'lobby',
  max_players INT NOT NULL DEFAULT 6,
  ai_count INT NOT NULL DEFAULT 1,
  current_round INT NOT NULL DEFAULT 0,
  phase_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- =========== ROOM PLAYERS ===========
CREATE TABLE public.room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  role public.player_role NOT NULL DEFAULT 'unassigned',
  seat INT NOT NULL,
  alive BOOLEAN NOT NULL DEFAULT true,
  ai_persona TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, seat),
  UNIQUE (room_id, user_id)
);
CREATE INDEX idx_room_players_room ON public.room_players(room_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_players TO authenticated;
GRANT ALL ON public.room_players TO service_role;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a member of a given room?
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.room_players WHERE room_id = _room_id AND user_id = auth.uid())
$$;

-- Helper: is the current user the host of a room?
CREATE OR REPLACE FUNCTION public.is_room_host(_room_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.rooms WHERE id = _room_id AND host_id = auth.uid())
$$;

-- Room policies
CREATE POLICY "rooms readable to members or by code lookup" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms insertable by host self" ON public.rooms FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "rooms updatable by host" ON public.rooms FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
CREATE POLICY "rooms deletable by host" ON public.rooms FOR DELETE TO authenticated USING (host_id = auth.uid());

-- Room player policies
CREATE POLICY "room_players readable by members" ON public.room_players FOR SELECT TO authenticated USING (public.is_room_member(room_id) OR public.is_room_host(room_id));
CREATE POLICY "room_players self join" ON public.room_players FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid() AND is_ai = false) OR public.is_room_host(room_id));
CREATE POLICY "room_players host or self update" ON public.room_players FOR UPDATE TO authenticated USING (public.is_room_host(room_id) OR user_id = auth.uid()) WITH CHECK (public.is_room_host(room_id) OR user_id = auth.uid());
CREATE POLICY "room_players host or self delete" ON public.room_players FOR DELETE TO authenticated USING (public.is_room_host(room_id) OR user_id = auth.uid());

-- =========== MESSAGES ===========
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.room_players(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  phase public.room_status NOT NULL DEFAULT 'day',
  round INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_room_created ON public.messages(room_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages readable by room members" ON public.messages FOR SELECT TO authenticated USING (public.is_room_member(room_id));
CREATE POLICY "messages insertable by own player" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.room_players p WHERE p.id = player_id AND p.room_id = room_id AND (p.user_id = auth.uid() OR public.is_room_host(room_id)))
);

-- =========== VOTES ===========
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  round INT NOT NULL,
  voter_player_id UUID NOT NULL REFERENCES public.room_players(id) ON DELETE CASCADE,
  target_player_id UUID NOT NULL REFERENCES public.room_players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, round, voter_player_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.votes TO authenticated;
GRANT ALL ON public.votes TO service_role;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes readable by room members" ON public.votes FOR SELECT TO authenticated USING (public.is_room_member(room_id));
CREATE POLICY "votes insertable by own player" ON public.votes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.room_players p WHERE p.id = voter_player_id AND p.room_id = room_id AND (p.user_id = auth.uid() OR public.is_room_host(room_id)))
);

-- =========== SUSPICION SCORES ===========
CREATE TABLE public.suspicion_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  round INT NOT NULL,
  observer_player_id UUID NOT NULL REFERENCES public.room_players(id) ON DELETE CASCADE,
  target_player_id UUID NOT NULL REFERENCES public.room_players(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_suspicion_room_round ON public.suspicion_scores(room_id, round);
GRANT SELECT, INSERT ON public.suspicion_scores TO authenticated;
GRANT ALL ON public.suspicion_scores TO service_role;
ALTER TABLE public.suspicion_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suspicion readable by room members" ON public.suspicion_scores FOR SELECT TO authenticated USING (public.is_room_member(room_id));

-- =========== TRIGGERS ===========
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rooms_updated BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Detective'));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== REALTIME ===========
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.suspicion_scores;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.votes REPLICA IDENTITY FULL;
