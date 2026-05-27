DROP FUNCTION IF EXISTS public.lookup_booking(text, text);

CREATE OR REPLACE FUNCTION public.lookup_booking(_ref text, _email text)
 RETURNS TABLE(ref_no text, type booking_type, customer_name text, email text, num_pax integer, total_amount numeric, subtotal_amount numeric, discount_amount numeric, promo_code text, payment_status payment_status, booking_status booking_status, booking_date_from date, booking_date_to date, course_title text, slot_label text, room_name text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    b.ref_no, b.type, b.customer_name, b.email, b.num_pax, b.total_amount,
    b.subtotal_amount, b.discount_amount, b.promo_code,
    b.payment_status, b.booking_status, b.booking_date_from, b.booking_date_to,
    c.title AS course_title,
    (cs.date_label || ' • ' || cs.time_label) AS slot_label,
    r.name AS room_name,
    b.created_at
  FROM public.bookings b
  LEFT JOIN public.courses c ON c.id = b.course_id
  LEFT JOIN public.course_slots cs ON cs.id = b.slot_id
  LEFT JOIN public.rooms r ON r.id = b.room_id
  WHERE upper(b.ref_no) = upper(_ref)
    AND lower(b.email) = lower(_email)
  LIMIT 1;
$function$;