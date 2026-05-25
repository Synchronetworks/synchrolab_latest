ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS billplz_bill_id text,
  ADD COLUMN IF NOT EXISTS payment_url text;

CREATE INDEX IF NOT EXISTS idx_bookings_billplz_bill_id ON public.bookings(billplz_bill_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ref_no ON public.bookings(ref_no);

CREATE OR REPLACE FUNCTION public.update_booking_payment(
  _ref_no text,
  _bill_id text,
  _paid boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
  SET
    payment_status = CASE WHEN _paid THEN 'paid'::payment_status ELSE 'unpaid'::payment_status END,
    booking_status = CASE WHEN _paid THEN 'confirmed'::booking_status ELSE booking_status END,
    billplz_bill_id = COALESCE(_bill_id, billplz_bill_id),
    updated_at = now()
  WHERE ref_no = _ref_no;
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_billplz_to_booking(
  _ref_no text,
  _bill_id text,
  _payment_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
  SET billplz_bill_id = _bill_id,
      payment_url = _payment_url,
      updated_at = now()
  WHERE ref_no = _ref_no;
END;
$$;

-- Restrict execution: only service_role (edge functions) can call these
REVOKE EXECUTE ON FUNCTION public.update_booking_payment(text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.attach_billplz_to_booking(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_booking_payment(text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.attach_billplz_to_booking(text, text, text) TO service_role;