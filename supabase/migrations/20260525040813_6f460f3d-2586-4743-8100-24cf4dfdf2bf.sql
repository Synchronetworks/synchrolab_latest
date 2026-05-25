-- Enums
CREATE TYPE public.promo_discount_type AS ENUM ('percent', 'fixed');
CREATE TYPE public.promo_applies_to AS ENUM ('all', 'course', 'room');

-- Promo codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type public.promo_discount_type NOT NULL,
  discount_value numeric NOT NULL CHECK (discount_value >= 0),
  applies_to public.promo_applies_to NOT NULL DEFAULT 'all',
  first_time_only boolean NOT NULL DEFAULT false,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  min_amount numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_codes_code ON public.promo_codes (upper(code));

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promo codes" ON public.promo_codes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Redemptions
CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id uuid,
  email text NOT NULL,
  discount_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_redemptions_promo ON public.promo_redemptions (promo_id);
CREATE INDEX idx_promo_redemptions_email ON public.promo_redemptions (lower(email));

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view redemptions" ON public.promo_redemptions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal_amount numeric NOT NULL DEFAULT 0;

-- Validate promo code function (public)
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  _code text,
  _email text,
  _subtotal numeric,
  _booking_type booking_type
)
RETURNS TABLE(valid boolean, message text, discount numeric, promo_id uuid, code text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.promo_codes%ROWTYPE;
  v_discount numeric := 0;
  v_used_by_email integer;
BEGIN
  SELECT * INTO p FROM public.promo_codes WHERE upper(code) = upper(_code) LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Kod promo tidak sah'::text, 0::numeric, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF NOT p.is_active THEN
    RETURN QUERY SELECT false, 'Kod promo tidak aktif'::text, 0::numeric, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF p.starts_at IS NOT NULL AND now() < p.starts_at THEN
    RETURN QUERY SELECT false, 'Kod promo belum bermula'::text, 0::numeric, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF p.expires_at IS NOT NULL AND now() > p.expires_at THEN
    RETURN QUERY SELECT false, 'Kod promo telah tamat'::text, 0::numeric, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF p.max_uses IS NOT NULL AND p.used_count >= p.max_uses THEN
    RETURN QUERY SELECT false, 'Kuota kod promo telah habis'::text, 0::numeric, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF p.applies_to <> 'all' AND p.applies_to::text <> _booking_type::text THEN
    RETURN QUERY SELECT false, 'Kod promo tidak terpakai untuk tempahan ini'::text, 0::numeric, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF _subtotal < p.min_amount THEN
    RETURN QUERY SELECT false, ('Jumlah minimum RM' || p.min_amount::text)::text, 0::numeric, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF p.first_time_only THEN
    SELECT count(*) INTO v_used_by_email
      FROM public.bookings
     WHERE lower(email) = lower(_email)
       AND payment_status = 'paid'::payment_status;
    IF v_used_by_email > 0 THEN
      RETURN QUERY SELECT false, 'Kod ini khas untuk pengguna kali pertama sahaja'::text, 0::numeric, NULL::uuid, NULL::text;
      RETURN;
    END IF;
  END IF;

  IF p.discount_type = 'percent' THEN
    v_discount := round((_subtotal * p.discount_value / 100)::numeric, 2);
  ELSE
    v_discount := p.discount_value;
  END IF;

  IF p.max_discount IS NOT NULL AND v_discount > p.max_discount THEN
    v_discount := p.max_discount;
  END IF;

  IF v_discount > _subtotal THEN
    v_discount := _subtotal;
  END IF;

  RETURN QUERY SELECT true, 'Kod promo sah'::text, v_discount, p.id, p.code;
END;
$$;

-- Update create_booking to accept promo code
CREATE OR REPLACE FUNCTION public.create_booking(
  _type booking_type,
  _customer_name text,
  _email text,
  _phone text,
  _num_pax integer,
  _total_amount numeric,
  _course_id uuid DEFAULT NULL,
  _slot_id uuid DEFAULT NULL,
  _room_id uuid DEFAULT NULL,
  _booking_date_from date DEFAULT NULL,
  _booking_date_to date DEFAULT NULL,
  _company text DEFAULT NULL,
  _notes text DEFAULT NULL,
  _promo_code text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref text;
  v_booking_id uuid;
  v_subtotal numeric := _total_amount;
  v_discount numeric := 0;
  v_final numeric := _total_amount;
  v_promo_id uuid;
  v_promo_code text;
  v_check record;
BEGIN
  IF length(_customer_name) < 2 OR length(_customer_name) > 200 THEN RAISE EXCEPTION 'Nama tidak sah'; END IF;
  IF _email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(_email) > 255 THEN RAISE EXCEPTION 'Emel tidak sah'; END IF;
  IF length(_phone) < 6 OR length(_phone) > 30 THEN RAISE EXCEPTION 'Nombor telefon tidak sah'; END IF;
  IF _num_pax < 1 OR _num_pax > 500 THEN RAISE EXCEPTION 'Bilangan peserta tidak sah'; END IF;
  IF _total_amount < 0 THEN RAISE EXCEPTION 'Jumlah tidak sah'; END IF;
  IF _notes IS NOT NULL AND length(_notes) > 2000 THEN RAISE EXCEPTION 'Nota terlalu panjang'; END IF;

  IF _promo_code IS NOT NULL AND length(trim(_promo_code)) > 0 THEN
    SELECT * INTO v_check FROM public.validate_promo_code(_promo_code, _email, v_subtotal, _type) LIMIT 1;
    IF NOT v_check.valid THEN
      RAISE EXCEPTION '%', v_check.message;
    END IF;
    v_discount := v_check.discount;
    v_promo_id := v_check.promo_id;
    v_promo_code := v_check.code;
    v_final := GREATEST(v_subtotal - v_discount, 0);
  END IF;

  INSERT INTO public.bookings (
    type, customer_name, email, phone, num_pax, total_amount,
    subtotal_amount, discount_amount, promo_code,
    course_id, slot_id, room_id, booking_date_from, booking_date_to,
    company, notes, user_id
  ) VALUES (
    _type, _customer_name, _email, _phone, _num_pax, v_final,
    v_subtotal, v_discount, v_promo_code,
    _course_id, _slot_id, _room_id, _booking_date_from, _booking_date_to,
    _company, _notes, auth.uid()
  )
  RETURNING ref_no, id INTO v_ref, v_booking_id;

  IF v_promo_id IS NOT NULL THEN
    INSERT INTO public.promo_redemptions (promo_id, booking_id, user_id, email, discount_amount)
    VALUES (v_promo_id, v_booking_id, auth.uid(), _email, v_discount);

    UPDATE public.promo_codes SET used_count = used_count + 1 WHERE id = v_promo_id;
  END IF;

  RETURN v_ref;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_booking(booking_type, text, text, text, integer, numeric, uuid, uuid, uuid, date, date, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(booking_type, text, text, text, integer, numeric, uuid, uuid, uuid, date, date, text, text, text) TO anon, authenticated;