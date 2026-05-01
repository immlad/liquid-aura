
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SERVERS
CREATE TABLE public.servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon_emoji TEXT DEFAULT '✨',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  join_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- MEMBERS
CREATE TABLE public.server_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(server_id, user_id)
);
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_server_member(_server_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.server_members WHERE server_id = _server_id AND user_id = _user_id);
$$;

CREATE POLICY "members can view their servers" ON public.servers FOR SELECT TO authenticated
  USING (public.is_server_member(id, auth.uid()));
CREATE POLICY "anyone signed in can create servers" ON public.servers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner can update server" ON public.servers FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner can delete server" ON public.servers FOR DELETE TO authenticated USING (auth.uid() = owner_id);
-- Lookup-by-code policy: allow SELECT of bare row when querying by join_code (we expose a SECURITY DEFINER fn instead)

CREATE POLICY "members can view membership rows for their servers" ON public.server_members FOR SELECT TO authenticated
  USING (public.is_server_member(server_id, auth.uid()));
CREATE POLICY "users can insert own membership" ON public.server_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can leave server" ON public.server_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CHANNELS
CREATE TYPE public.channel_type AS ENUM ('text', 'voice');
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.channel_type NOT NULL DEFAULT 'text',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view channels" ON public.channels FOR SELECT TO authenticated
  USING (public.is_server_member(server_id, auth.uid()));
CREATE POLICY "members create channels" ON public.channels FOR INSERT TO authenticated
  WITH CHECK (public.is_server_member(server_id, auth.uid()));
CREATE POLICY "members delete channels" ON public.channels FOR DELETE TO authenticated
  USING (public.is_server_member(server_id, auth.uid()));

-- MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_can_access_channel(_channel_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.channels c
    JOIN public.server_members sm ON sm.server_id = c.server_id
    WHERE c.id = _channel_id AND sm.user_id = _user_id
  );
$$;

CREATE POLICY "members view messages" ON public.messages FOR SELECT TO authenticated
  USING (public.user_can_access_channel(channel_id, auth.uid()));
CREATE POLICY "members post messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.user_can_access_channel(channel_id, auth.uid()));
CREATE POLICY "author deletes own messages" ON public.messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.channels REPLICA IDENTITY FULL;
ALTER TABLE public.server_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.server_members;

-- Generate join code helper
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END; $$;

-- Create server with default channels and owner membership
CREATE OR REPLACE FUNCTION public.create_server(_name TEXT, _icon TEXT DEFAULT '✨')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_id UUID;
  code TEXT;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  LOOP
    code := public.generate_join_code();
    EXIT WHEN NOT EXISTS(SELECT 1 FROM public.servers WHERE join_code = code);
  END LOOP;
  INSERT INTO public.servers (name, owner_id, join_code, icon_emoji)
    VALUES (_name, uid, code, COALESCE(_icon, '✨'))
    RETURNING id INTO new_id;
  INSERT INTO public.server_members (server_id, user_id) VALUES (new_id, uid);
  INSERT INTO public.channels (server_id, name, type, position) VALUES
    (new_id, 'general', 'text', 0),
    (new_id, 'announcements', 'text', 1),
    (new_id, 'Lounge', 'voice', 2);
  RETURN new_id;
END; $$;

-- Join by code
CREATE OR REPLACE FUNCTION public.join_server_by_code(_code TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sid UUID;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id INTO sid FROM public.servers WHERE upper(join_code) = upper(_code);
  IF sid IS NULL THEN RAISE EXCEPTION 'Invalid code'; END IF;
  INSERT INTO public.server_members (server_id, user_id) VALUES (sid, uid)
    ON CONFLICT DO NOTHING;
  RETURN sid;
END; $$;
