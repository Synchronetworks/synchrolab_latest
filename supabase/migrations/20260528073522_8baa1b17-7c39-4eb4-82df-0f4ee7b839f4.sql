
DROP FUNCTION IF EXISTS public.create_booking(public.booking_type, text, text, text, integer, numeric, uuid, uuid, uuid, date, date, text, text, text);

CREATE OR REPLACE FUNCTION public.create_booking(
  _type booking_type,
  _customer_name text,
  _email text,
  _phone text,
  _num_pax integer,
  _total_amount numeric,
  _course_id uuid DEFAULT NULL::uuid,
  _slot_id uuid DEFAULT NULL::uuid,
  _room_id uuid DEFAULT NULL::uuid,
  _booking_date_from date DEFAULT NULL::date,
  _booking_date_to date DEFAULT NULL::date,
  _company text DEFAULT NULL::text,
  _notes text DEFAULT NULL::text,
  _promo_code text DEFAULT NULL::text,
  _is_sibling boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ref text;
  v_booking_id uuid;
  v_subtotal numeric := _total_amount;
  v_discount numeric := 0;
  v_final numeric := _total_amount;
  v_promo_id uuid;
  v_promo_code text;
  v_check record;
  v_course public.courses%ROWTYPE;
  v_unit numeric;
  v_today date := (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;
BEGIN
  IF length(_customer_name) < 2 OR length(_customer_name) > 200 THEN RAISE EXCEPTION 'Nama tidak sah'; END IF;
  IF _email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(_email) > 255 THEN RAISE EXCEPTION 'Emel tidak sah'; END IF;
  IF length(_phone) < 6 OR length(_phone) > 30 THEN RAISE EXCEPTION 'Nombor telefon tidak sah'; END IF;
  IF _num_pax < 1 OR _num_pax > 500 THEN RAISE EXCEPTION 'Bilangan peserta tidak sah'; END IF;
  IF _total_amount < 0 THEN RAISE EXCEPTION 'Jumlah tidak sah'; END IF;
  IF _notes IS NOT NULL AND length(_notes) > 2000 THEN RAISE EXCEPTION 'Nota terlalu panjang'; END IF;

  IF _type = 'course'::booking_type AND _course_id IS NOT NULL THEN
    SELECT * INTO v_course FROM public.courses WHERE id = _course_id LIMIT 1;
    IF FOUND THEN
      v_unit := v_course.price;
      IF v_course.early_bird_price IS NOT NULL AND v_course.early_bird_until IS NOT NULL
         AND v_today <= v_course.early_bird_until
         AND v_course.early_bird_price < v_unit THEN
        v_unit := v_course.early_bird_price;
      END IF;
      IF _is_sibling AND _num_pax >= 2 AND v_course.sibling_price IS NOT NULL AND v_course.sibling_price < v_unit THEN
        v_unit := v_course.sibling_price;
      END IF;
      v_subtotal := round((v_unit * _num_pax)::numeric, 2);
      v_final := v_subtotal;
    END IF;
  END IF;

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
$function$;

REVOKE EXECUTE ON FUNCTION public.create_booking(booking_type, text, text, text, integer, numeric, uuid, uuid, uuid, date, date, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(booking_type, text, text, text, integer, numeric, uuid, uuid, uuid, date, date, text, text, text, boolean) TO anon, authenticated;
