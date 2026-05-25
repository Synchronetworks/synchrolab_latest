DROP POLICY IF EXISTS "Anyone can create booking" ON public.bookings;

CREATE POLICY "Anyone can create booking"
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(customer_name) >= 2 AND length(customer_name) <= 200
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 255
  AND length(phone) >= 6 AND length(phone) <= 30
  AND num_pax > 0 AND num_pax <= 500
  AND total_amount >= 0
  AND (user_id IS NULL OR user_id = auth.uid())
  AND payment_status = 'unpaid'::payment_status
  AND booking_status = 'pending'::booking_status
);