// Verifies the redirect_url query parameters from Billplz and returns booking status.
// Used by the /bayaran/selesai page.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Billplz X-Signature for Redirect URL: HMAC-SHA256 over a FIXED subset of
// fields prefixed with "billplz", joined as "billplz{key}{value}" by "|".
// Per spec, ONLY id, paid, paid_at are signed — transaction_id/status excluded.
const REDIRECT_SIGNED_KEYS = ["id", "paid", "paid_at"];

async function verifyXSignature(
  fields: Record<string, string>,
  providedSignature: string,
  secret: string,
): Promise<boolean> {
  const keys = [...REDIRECT_SIGNED_KEYS].sort((a, b) =>
    `billplz${a}`.toLowerCase().localeCompare(`billplz${b}`.toLowerCase()),
  );
  const stringToSign = keys.map((k) => `billplz${k}${fields[k] ?? ""}`).join("|");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(stringToSign));
  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computed.toLowerCase() === providedSignature.toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    const xSignatureKey = Deno.env.get("BILLPLZ_X_SIGNATURE_KEY");
    if (!xSignatureKey) return json({ error: "misconfigured" }, 500);

    const body = await req.json();
    const fields = (body.fields ?? {}) as Record<string, string>;
    const sig = fields.x_signature ?? "";

    const valid = await verifyXSignature(fields, sig, xSignatureKey);
    if (!valid) return json({ valid: false, error: "Invalid signature" }, 403);

    const ref = fields.reference_1 ?? "";
    if (!ref) return json({ valid: false, error: "Missing ref" }, 400);

    const paid = (fields.paid ?? "false").toLowerCase() === "true";
    const billId = fields.id ?? null;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fallback: if webhook hasn't fired yet, update the booking now since
    // signature is verified. Idempotent (safe to call repeatedly).
    if (paid) {
      const { error: rpcErr } = await admin.rpc("update_booking_payment", {
        _ref_no: ref,
        _bill_id: billId,
        _paid: true,
      });
      if (rpcErr) console.error("update_booking_payment error", rpcErr);
    }

    const { data, error } = await admin
      .from("bookings")
      .select("ref_no, customer_name, total_amount, payment_status, booking_status, type")
      .eq("ref_no", ref)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ valid: false, error: "Not found" }, 404);

    return json({
      valid: true,
      paid: (fields.paid ?? "false").toLowerCase() === "true",
      booking: data,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
