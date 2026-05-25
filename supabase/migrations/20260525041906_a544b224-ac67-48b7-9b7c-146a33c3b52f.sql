
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  text text NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active testimonials"
ON public.testimonials FOR SELECT
TO anon, authenticated
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage testimonials"
ON public.testimonials FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.testimonials (name, role, text, sort_order) VALUES
('Aizat Rahman', 'IT Manager, Petronas Subsidiary', 'Kursus Cybersecurity SynchroLab sangat praktikal. Trainer beri contoh kes sebenar di Malaysia. Highly recommended!', 1),
('Nurin Sofea', 'Data Analyst, CIMB', 'Selepas kursus Power BI 3 hari, saya dah boleh bina dashboard sendiri untuk pasukan. Bahan kursus pun lengkap.', 2),
('Daniel Wong', 'Founder, TechStartup MY', 'Sewa auditorium untuk product launch — kemudahan top notch, harga berpatutan, staff sangat helpful.', 3);
