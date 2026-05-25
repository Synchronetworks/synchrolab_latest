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
  _notes text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref text;
BEGIN
  -- Server-side validation
  IF length(_customer_name) < 2 OR length(_customer_name) > 200 THEN
    RAISE EXCEPTION 'Nama tidak sah';
  END IF;
  IF _email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(_email) > 255 THEN
    RAISE EXCEPTION 'Emel tidak sah';
  END IF;
  IF length(_phone) < 6 OR length(_phone) > 30 THEN
    RAISE EXCEPTION 'Nombor telefon tidak sah';
  END IF;
  IF _num_pax < 1 OR _num_pax > 500 THEN
    RAISE EXCEPTION 'Bilangan peserta tidak sah';
  END IF;
  IF _total_amount < 0 THEN
    RAISE EXCEPTION 'Jumlah tidak sah';
  END IF;
  IF _notes IS NOT NULL AND length(_notes) > 2000 THEN
    RAISE EXCEPTION 'Nota terlalu panjang';
  END IF;

  INSERT INTO public.bookings (
    type, customer_name, email, phone, num_pax, total_amount,
    course_id, slot_id, room_id, booking_date_from, booking_date_to,
    company, notes, user_id
  ) VALUES (
    _type, _customer_name, _email, _phone, _num_pax, _total_amount,
    _course_id, _slot_id, _room_id, _booking_date_from, _booking_date_to,
    _company, _notes, auth.uid()
  )
  RETURNING ref_no INTO v_ref;

  RETURN v_ref;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking(
  booking_type, text, text, text, integer, numeric, uuid, uuid, uuid, date, date, text, text
) TO anon, authenticated;