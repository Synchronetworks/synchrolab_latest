import { useEffect, useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const RECAPTCHA_SITE_KEY = "6LeUiAAtAAAAANLykE2AcC3N7jK2FLv5UdjKJQob";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const schema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(300).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(5000),
});

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (document.querySelector(`script[src*="recaptcha/api.js"]`)) return;
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!window.grecaptcha) { toast.error("reCAPTCHA belum dimuatkan. Sila tunggu sebentar."); return; }

    setSubmitting(true);
    try {
      const token = await new Promise<string>((resolve, reject) => {
        window.grecaptcha!.ready(async () => {
          try {
            const t = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action: "contact" });
            resolve(t);
          } catch (err) { reject(err); }
        });
      });

      const { data, error } = await supabase.functions.invoke("submit-contact", {
        body: { ...parsed.data, recaptchaToken: token },
      });
      if (error || (data as any)?.error) {
        toast.error("Gagal hantar mesej", { description: (data as any)?.error || error?.message });
        return;
      }
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success("Mesej dihantar! Kami akan balas dalam 1 hari bekerja.");
    } catch (err: any) {
      toast.error("Gagal hantar mesej", { description: err?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="bg-gradient-hero py-16">
        <div className="container max-w-3xl text-center">
          <h1 className="font-display text-4xl font-extrabold text-white md:text-5xl">Hubungi Kami</h1>
          <p className="mt-4 text-white/80 mb-[50px]">Kami sedia membantu anda. Daripada pertanyaan kursus hinggalah cadangan kursus.</p>
        </div>
      </section>

      <section className="container py-14 pt-0 -mt-[60px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {[
              { icon: MapPin, title: "Lokasi", lines: ["Synchronetwork Sdn. Bhd. (1194790-K)", "79A, Jalan Nova U5/N, Subang Bestari", "Sek. U5, 40150 Shah Alam, Selangor"] },
              { icon: Mail, title: "E-mel", lines: ["salam@synchronet.com.my"] },
              { icon: Phone, title: "Telefon", lines: ["+60 10-584 7675", "Isnin – Jumaat, 9am – 6pm"] },
            ].map((c) => (
              <div key={c.title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-accent shadow-glow">
                  <c.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground">{c.title}</p>
                  {c.lines.map((l) => <p key={l} className="text-sm text-muted-foreground">{l}</p>)}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Nama</Label><Input required className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>E-mel</Label><Input required type="email" className="mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Subjek</Label><Input className="mt-1.5" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>Mesej</Label><Textarea required rows={5} className="mt-1.5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <p className="text-xs text-muted-foreground">
              Borang ini dilindungi oleh reCAPTCHA. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privasi</a> & <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">Terma</a> Google dikenakan.
            </p>
            <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Menghantar..." : "Hantar Mesej"}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
};

export default Contact;
