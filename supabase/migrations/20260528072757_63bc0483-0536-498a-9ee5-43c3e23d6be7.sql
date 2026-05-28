ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS seating_layouts jsonb NOT NULL DEFAULT '[]'::jsonb;