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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const ref_no = String(body.ref_no ?? "").trim();
    const email = String(body.email ?? "").trim();
    if (!ref_no || !email) return json({ error: "ref_no & email required" }, 400);

    const apiKey = Deno.env.get("BILLPLZ_API_KEY");
    const collectionId = Deno.env.get("BILLPLZ_COLLECTION_ID");
    const mode = (Deno.env.get("BILLPLZ_MODE") ?? "sandbox").toLowerCase();
    if (!apiKey || !collectionId) {
      return json({ error: "Billplz tidak dikonfigurasikan" }, 500);
    }
    const baseUrl =
      mode === "production"
        ? "https://www.billplz.com/api/v3"
        : "https://www.billplz-sandbox.com/api/v3";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Look up booking (server-side) — validate ref + email match
    const { data: booking, error: lookupErr } = await admin
      .from("bookings")
      .select("id, ref_no, email, customer_name, total_amount, payment_status, payment_url, billplz_bill_id")
      .eq("ref_no", ref_no)
      .maybeSingle();

    if (lookupErr) return json({ error: lookupErr.message }, 500);
    if (!booking) return json({ error: "Tempahan tidak dijumpai" }, 404);
    if (booking.email.toLowerCase() !== email.toLowerCase())
      return json({ error: "Emel tidak sepadan" }, 403);

    // If already paid, just return
    if (booking.payment_status === "paid") {
      return json({ already_paid: true, ref_no: booking.ref_no }, 200);
    }

    // If we already have an active bill_id, return its URL
    if (booking.billplz_bill_id && booking.payment_url) {
      return json({ bill_id: booking.billplz_bill_id, url: booking.payment_url });
    }

    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    const callbackUrl = `${supabaseUrl}/functions/v1/billplz-webhook`;
    const redirectUrl = `${origin}/bayaran/selesai`;

    const params = new URLSearchParams({
      collection_id: collectionId,
      email: booking.email,
      name: booking.customer_name,
      amount: String(Math.round(Number(booking.total_amount) * 100)),
      callback_url: callbackUrl,
      redirect_url: redirectUrl,
      description: `Tempahan Synchrolab ${booking.ref_no}`,
      reference_1_label: "Rujukan",
      reference_1: booking.ref_no,
    });

    const bpRes = await fetch(`${baseUrl}/bills`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const bpData = await bpRes.json();
    if (!bpRes.ok) {
      console.error("Billplz error:", bpData);
      return json({ error: "Billplz error", detail: bpData }, 502);
    }

    await admin.rpc("attach_billplz_to_booking", {
      _ref_no: booking.ref_no,
      _bill_id: bpData.id,
      _payment_url: bpData.url,
    });

    return json({ bill_id: bpData.id, url: bpData.url });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
