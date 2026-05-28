
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS hrdc_claimable boolean NOT NULL DEFAULT false;
