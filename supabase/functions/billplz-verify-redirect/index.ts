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

async function verifyXSignature(
  fields: Record<string, string>,
  providedSignature: string,
  secret: string,
): Promise<boolean> {
  // Billplz redirect signs every billplz[...] query parameter except x_signature,
  // sorted by the constructed source string (case-insensitive).
  const stringToSign = Object.entries(fields)
    .filter(([k]) => k.toLowerCase() !== "x_signature")
    .map(([k, v]) => `billplz${k}${v ?? ""}`)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .join("|");
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
    const apiKey = Deno.env.get("BILLPLZ_API_KEY");
    const mode = (Deno.env.get("BILLPLZ_MODE") ?? "sandbox").toLowerCase();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!xSignatureKey || !apiKey || !supabaseUrl || !serviceKey) {
      return json({ error: "misconfigured" }, 500);
    }

    const body = await req.json();
    const fields = (body.fields ?? {}) as Record<string, string>;
    const sig = fields.x_signature ?? "";

    const valid = await verifyXSignature(fields, sig, xSignatureKey);
    if (!valid) return json({ valid: false, error: "Invalid signature" });

    const paid = (fields.paid ?? "false").toLowerCase() === "true";
    const billId = fields.id ?? "";
    if (!billId) return json({ valid: false, error: "Missing bill ID" });

    const admin = createClient(supabaseUrl, serviceKey);

    const baseUrl =
      mode === "production"
        ? "https://www.billplz.com/api/v3"
        : "https://www.billplz-sandbox.com/api/v3";
    const billRes = await fetch(`${baseUrl}/bills/${encodeURIComponent(billId)}`, {
      headers: { Authorization: `Basic ${btoa(apiKey + ":")}` },
    });
    const billData = await billRes.json().catch(() => ({}));
    if (!billRes.ok) {
      console.error("Billplz bill lookup error", billData);
      return json({ valid: false, error: "Gagal menyemak bil Billplz" });
    }

    const ref = String(billData.reference_1 ?? "").trim();
    if (!ref) return json({ valid: false, error: "Missing ref" });

    // Fallback: if webhook hasn't fired yet, update the booking now since
    // signature is verified. Idempotent (safe to call repeatedly).
    if (paid || billData.paid === true) {
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
    if (!data) return json({ valid: false, error: "Not found" });

    return json({
      valid: true,
      paid: paid || billData.paid === true,
      booking: data,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
