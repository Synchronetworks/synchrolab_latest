
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_by uuid;

CREATE OR REPLACE FUNCTION public.admin_check_in_booking(_ref text)
RETURNS TABLE(
  ref_no text,
  customer_name text,
  email text,
  num_pax integer,
  course_title text,
  slot_label text,
  payment_status payment_status,
  booking_status booking_status,
  checked_in_at timestamptz,
  already_checked_in boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_already boolean := false;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Tidak dibenarkan';
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE upper(public.bookings.ref_no) = upper(_ref) LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tempahan tidak dijumpai';
  END IF;

  IF v_booking.payment_status <> 'paid'::payment_status THEN
    RAISE EXCEPTION 'Tempahan belum dibayar';
  END IF;

  IF v_booking.checked_in_at IS NOT NULL THEN
    v_already := true;
  ELSE
    UPDATE public.bookings
      SET checked_in_at = now(),
          checked_in_by = auth.uid(),
          updated_at = now()
      WHERE id = v_booking.id
      RETURNING * INTO v_booking;
  END IF;

  RETURN QUERY
    SELECT
      v_booking.ref_no,
      v_booking.customer_name,
      v_booking.email,
      v_booking.num_pax,
      c.title,
      (cs.date_label || ' • ' || cs.time_label),
      v_booking.payment_status,
      v_booking.booking_status,
      v_booking.checked_in_at,
      v_already
    FROM (SELECT 1) x
    LEFT JOIN public.courses c ON c.id = v_booking.course_id
    LEFT JOIN public.course_slots cs ON cs.id = v_booking.slot_id;
END;
$$;
