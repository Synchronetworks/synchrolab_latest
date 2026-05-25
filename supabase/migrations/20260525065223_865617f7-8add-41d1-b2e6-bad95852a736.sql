CREATE OR REPLACE FUNCTION public.validate_promo_code(_code text, _email text, _subtotal numeric, _booking_type booking_type)
 RETURNS TABLE(valid boolean, message text, discount numeric, promo_id uuid, code text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  p public.promo_codes%ROWTYPE;
  v_discount numeric := 0;
  v_used_by_email integer;
BEGIN
  SELECT * INTO p FROM public.promo_codes pc WHERE upper(pc.code) = upper(_code) LIMIT 1;

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
      FROM public.bookings b
     WHERE lower(b.email) = lower(_email)
       AND b.payment_status = 'paid'::payment_status;
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
$function$;