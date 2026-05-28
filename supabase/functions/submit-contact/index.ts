import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { name, email, subject, message, recaptchaToken } = await req.json();

    if (!name || !email || !message || !recaptchaToken) {
      return new Response(JSON.stringify({ error: 'Medan tidak lengkap' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate lengths/format
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 200)
      return new Response(JSON.stringify({ error: 'Nama tidak sah' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255)
      return new Response(JSON.stringify({ error: 'Emel tidak sah' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (typeof message !== 'string' || message.trim().length < 5 || message.length > 5000)
      return new Response(JSON.stringify({ error: 'Mesej tidak sah' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (subject && (typeof subject !== 'string' || subject.length > 300))
      return new Response(JSON.stringify({ error: 'Subjek tidak sah' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Verify reCAPTCHA v3
    const secret = Deno.env.get('RECAPTCHA_SECRET_KEY')!;
    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(recaptchaToken)}`,
    });
    const verifyData = await verifyRes.json();
    console.log('reCAPTCHA verify:', verifyData);

    if (!verifyData.success || (typeof verifyData.score === 'number' && verifyData.score < 0.5)) {
      return new Response(JSON.stringify({ error: 'Pengesahan reCAPTCHA gagal. Sila cuba lagi.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || null,
      message: message.trim(),
    });

    if (error) {
      console.error('Insert error:', error);
      return new Response(JSON.stringify({ error: 'Gagal simpan mesej' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Ralat pelayan' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
