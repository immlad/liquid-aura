
CREATE OR REPLACE FUNCTION public.update_join_code(_server_id UUID, _new_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  cleaned TEXT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  cleaned := upper(trim(_new_code));

  IF cleaned !~ '^[A-Z0-9]{4,12}$' THEN
    RAISE EXCEPTION 'Code must be 4-12 letters or numbers';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.servers WHERE id = _server_id AND owner_id = uid) THEN
    RAISE EXCEPTION 'Only the owner can change the invite code';
  END IF;

  IF EXISTS (SELECT 1 FROM public.servers WHERE upper(join_code) = cleaned AND id <> _server_id) THEN
    RAISE EXCEPTION 'That code is already taken';
  END IF;

  UPDATE public.servers SET join_code = cleaned WHERE id = _server_id;
  RETURN cleaned;
END; $$;

ALTER TABLE public.servers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.servers;
