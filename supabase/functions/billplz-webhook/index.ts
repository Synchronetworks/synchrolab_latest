import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

async function verifyXSignature(
  fields: Record<string, string>,
  providedSignature: string,
  secret: string,
): Promise<boolean> {
  // Billplz callback signs every received key-value pair except x_signature,
  // sorted by the constructed source string (case-insensitive).
  const stringToSign = Object.entries(fields)
    .filter(([k]) => k.toLowerCase() !== "x_signature")
    .map(([k, v]) => `${k}${v ?? ""}`)
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

// Parse webhook body — Billplz sends application/x-www-form-urlencoded
// with flat keys like "id", "paid", "x_signature".
function parseFormBody(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const xSignatureKey = Deno.env.get("BILLPLZ_X_SIGNATURE_KEY");
    if (!xSignatureKey) {
      console.error("Missing BILLPLZ_X_SIGNATURE_KEY");
      return new Response("misconfigured", { status: 500, headers: corsHeaders });
    }

    const rawBody = await req.text();
    const fields = parseFormBody(rawBody);
    const providedSig = fields.x_signature ?? "";

    const ok = await verifyXSignature(fields, providedSig, xSignatureKey);
    if (!ok) {
      console.warn("Invalid x_signature for bill", fields.id);
      return new Response("invalid signature", { status: 403, headers: corsHeaders });
    }

    const ref = fields.reference_1;
    if (!ref) {
      console.warn("Webhook missing reference_1", fields);
      return new Response("missing ref", { status: 400, headers: corsHeaders });
    }

    const paid = (fields.paid ?? "false").toLowerCase() === "true";
    const billId = fields.id ?? null;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await admin.rpc("update_booking_payment", {
      _ref_no: ref,
      _bill_id: billId,
      _paid: paid,
    });
    if (error) {
      console.error("DB update error", error);
      return new Response("db error", { status: 500, headers: corsHeaders });
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("Webhook error", e);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});
