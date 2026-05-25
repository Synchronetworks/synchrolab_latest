
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS company text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_age_check CHECK (age IS NULL OR (age >= 1 AND age <= 120));

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to link past bookings (by email) to the current user
CREATE OR REPLACE FUNCTION public.link_bookings_to_user()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tidak dibenarkan';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN RETURN 0; END IF;

  UPDATE public.bookings
  SET user_id = auth.uid()
  WHERE user_id IS NULL
    AND lower(email) = lower(v_email);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
