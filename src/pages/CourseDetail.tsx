import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, CalendarDays, CheckCircle2, Clock, GraduationCap, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCourseBySlug, type SlotRow } from "@/hooks/useCatalog";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const bookingSchema = z.object({
  customer_name: z.string().trim().min(2, "Nama terlalu pendek").max(200),
  email: z.string().trim().email("Emel tidak sah").max(255),
  phone: z.string().trim().min(6, "Nombor telefon tidak sah").max(30),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  num_pax: z.number().int().min(1).max(500),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

const CourseDetail = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useCourseBySlug(id);

  const [selectedSlot, setSelectedSlot] = useState<SlotRow | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ customer_name: "", customer_age: "", email: "", phone: "", company: "", num_pax: 1, notes: "" });
  const [isParticipant, setIsParticipant] = useState(true);
  const [participants, setParticipants] = useState<{ name: string; age: string }[]>([]);
  const [lockedEmail, setLockedEmail] = useState(false);
  const [lockedPhone, setLockedPhone] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const participantsCount = isParticipant ? form.num_pax : Math.max(0, form.num_pax);

  useEffect(() => {
    setParticipants((prev) => {
      const next = [...prev];
      while (next.length < participantsCount) next.push({ name: "", age: "" });
      next.length = participantsCount;
      return next;
    });
  }, [participantsCount]);

  // Prefill from logged-in user's profile
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", session.user.id)
        .maybeSingle();
      const emailVal = session.user.email || "";
      const phoneVal = profile?.phone || "";
      setForm((f) => ({
        ...f,
        customer_name: f.customer_name || profile?.full_name || "",
        email: f.email || emailVal,
        phone: f.phone || phoneVal,
      }));
      if (emailVal) setLockedEmail(true);
      if (phoneVal) setLockedPhone(true);
    })();
  }, []);

  // Auto-sync first participant with booker when ticked
  useEffect(() => {
    if (!isParticipant || participants.length === 0) return;
    const first = participants[0];
    if (first.name !== form.customer_name || first.age !== form.customer_age) {
      const next = [...participants];
      next[0] = { name: form.customer_name, age: form.customer_age };
      setParticipants(next);
    }
  }, [isParticipant, form.customer_name, form.customer_age, participants]);

  const course = data?.course;
  const slots = data?.slots ?? [];

  const total = useMemo(() => {
    if (!course) return 0;
    const unit = course.group_price && form.num_pax >= 5 ? course.group_price : course.price;
    return unit * form.num_pax;
  }, [course, form.num_pax]);

  const finalTotal = Math.max(0, total - (promo?.discount ?? 0));

  // Auto-clear promo if subtotal changes
  useEffect(() => {
    if (promo) setPromo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    if (!form.email) {
      toast.error("Sila isi e-mel dahulu");
      return;
    }
    setValidatingPromo(true);
    const { data, error } = await supabase.rpc("validate_promo_code", {
      _code: code,
      _email: form.email,
      _subtotal: total,
      _booking_type: "course",
    });
    setValidatingPromo(false);
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row?.valid) {
      setPromo(null);
      toast.error(row?.message || error?.message || "Kod promo tidak sah");
      return;
    }
    setPromo({ code: row.code, discount: Number(row.discount) });
    toast.success(`Diskaun RM${Number(row.discount).toLocaleString()} digunakan`);
  };

  if (isLoading) {
    return (
      <div className="container flex justify-center py-32 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container py-32 text-center">
        <h1 className="font-display text-2xl font-bold">Kursus tidak dijumpai</h1>
        <Button asChild className="mt-6"><Link to="/kursus">Kembali ke senarai</Link></Button>
      </div>
    );
  }

  const openBooking = (slot?: SlotRow) => {
    if (slot) setSelectedSlot(slot);
    else if (slots.length > 0) setSelectedSlot(slots.find((s) => s.seats_left > 0) ?? slots[0]);
    setSuccess(null);
    setOpen(true);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Sila pilih slot tarikh.");
      return;
    }
    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const notes = [
      isParticipant ? "Penempah juga adalah peserta" : "Penempah BUKAN peserta",
      participants.length > 0
        ? "Peserta: " +
          participants
            .map((p, i) => `${i + 1}) ${p.name || "-"} (${p.age || "-"} thn)`)
            .join(", ")
        : null,
      parsed.data.notes,
    ].filter(Boolean).join(" • ") || null;

    const { data: refNo, error: insertErr } = await supabase.rpc("create_booking", {
      _type: "course",
      _customer_name: parsed.data.customer_name,
      _email: parsed.data.email,
      _phone: parsed.data.phone,
      _num_pax: parsed.data.num_pax,
      _total_amount: total,
      _course_id: course.id,
      _slot_id: selectedSlot.id,
      _company: parsed.data.company || null,
      _notes: notes,
      _promo_code: promo?.code ?? null,
    });
    if (insertErr || !refNo) {
      setSubmitting(false);
      toast.error("Gagal menempah", { description: insertErr?.message ?? "Ralat tidak diketahui" });
      return;
    }

    // Cipta bil Billplz dan redirect ke laman bayaran
    toast.info("Menyediakan laman bayaran...");
    const { data: billData, error: billErr } = await supabase.functions.invoke("create-billplz-bill", {
      body: { ref_no: refNo, email: parsed.data.email },
    });
    setSubmitting(false);
    if (billErr || !billData?.url) {
      toast.error("Tempahan berjaya tetapi gagal buka laman bayaran", {
        description: `Sila ke Dashboard untuk teruskan bayaran. Ref: ${refNo}`,
      });
      setSuccess(refNo as string);
      return;
    }
    setForm({ customer_name: "", customer_age: "", email: "", phone: "", company: "", num_pax: 1, notes: "" });
    window.location.href = billData.url;
  };

  return (
    <>
      <section className="bg-gradient-hero py-16">
        <div className="container">
          <Link to="/kursus" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Kembali ke senarai kursus
          </Link>
          <div className="mt-6 grid items-center gap-10 lg:grid-cols-[1fr_420px]">
            <div>
              <Badge className="bg-accent text-accent-foreground hover:bg-accent">{course.category}</Badge>
              <h1 className="mt-4 font-display text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">
                {course.title}
              </h1>
              

              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/85">
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> {course.duration}</span>
                {course.facilitator && <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> {course.facilitator}</span>}
                <span className="inline-flex items-center gap-2"><Award className="h-4 w-4 text-accent" /> Sijil disediakan</span>
              </div>
            </div>
            {course.image && (
              <div className="overflow-hidden rounded-2xl border border-white/10 shadow-elegant">
                <img
                  src={course.image}
                  alt={course.title}
                  loading="lazy"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Tentang Kursus</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                {course.short_desc}
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Silibus & Kandungan</h2>
              <ul className="mt-4 space-y-3">
                {course.syllabus.map((s) => (
                  <li key={s} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    <span className="text-sm text-foreground/85">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-display text-lg font-bold">Kelayakan Peserta</h3>
                <p className="mt-2 text-sm text-muted-foreground">{course.prerequisites ?? "Tiada"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-display text-lg font-bold">Sijil yang Diterima</h3>
                <p className="mt-2 text-sm text-muted-foreground">{course.certificate ?? "Sijil SynchroLab"}</p>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Slot Tarikh Tersedia</h2>
              <div className="mt-4 grid gap-3">
                {slots.length === 0 && <p className="text-sm text-muted-foreground">Belum ada slot tersedia.</p>}
                {slots.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft">
                        <CalendarDays className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{s.date_label}</p>
                        <p className="text-xs text-muted-foreground">{s.time_label} • {s.seats_left > 0 ? `${s.seats_left} tempat tinggal` : "Penuh"}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={s.seats_left > 0 ? "accent" : "outline"}
                      disabled={s.seats_left === 0}
                      onClick={() => openBooking(s)}
                    >
                      {s.seats_left > 0 ? "Pilih Slot" : "Penuh"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar booking card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Yuran kursus</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-primary">
                RM{course.price.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground"> /peserta</span>
              </p>
              {course.group_price && (
                <p className="mt-1 text-sm text-success">
                  RM{course.group_price.toLocaleString()}/pax untuk kumpulan 5+ peserta
                </p>
              )}

              <Button
                variant="accent"
                size="lg"
                className="mt-6 w-full"
                disabled={slots.every((s) => s.seats_left === 0)}
                onClick={() => openBooking()}
              >
                <GraduationCap className="h-4 w-4" /> Daftar Sekarang
              </Button>
              <Button asChild variant="outline" size="lg" className="mt-2 w-full">
                <Link to="/hubungi">Tanya Pertanyaan</Link>
              </Button>

              <ul className="mt-6 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Bayaran selamat (FPX, kad)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Resit & invoice automatik</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> HRD Corp claimable</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tempah Kursus</DialogTitle>
            <DialogDescription>{course.title}</DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-success/30 bg-success/5 p-5 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
                <p className="mt-3 font-display text-lg font-bold text-foreground">Tempahan diterima!</p>
                <p className="mt-1 text-sm text-muted-foreground">Nombor rujukan anda:</p>
                <p className="mt-2 font-display text-xl font-bold text-primary">{success}</p>
                <p className="mt-3 text-xs text-muted-foreground">Semak status di halaman "Semak Tempahan" menggunakan rujukan dan emel anda.</p>
              </div>
              <Button onClick={() => setOpen(false)} className="w-full" variant="accent">Tutup</Button>
            </div>
          ) : (
            <form onSubmit={submitBooking} className="space-y-4">
              <div>
                <Label>Slot tarikh</Label>
                <select
                  required
                  value={selectedSlot?.id ?? ""}
                  onChange={(e) => setSelectedSlot(slots.find((s) => s.id === e.target.value) ?? null)}
                  className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {slots.filter((s) => s.seats_left > 0).map((s) => (
                    <option key={s.id} value={s.id}>{s.date_label} ({s.seats_left} tempat)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-[1fr_80px_120px] gap-3">
                <div>
                  <Label>Nama penuh *</Label>
                  <Input required className="mt-1.5" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={isParticipant}
                      onCheckedChange={(c) => setIsParticipant(c === true)}
                    />
                    <span>Nama ini juga adalah peserta</span>
                  </label>
                </div>
                <div>
                  <Label>Umur *</Label>
                  <Input required type="number" min={1} max={120} className="mt-1.5" value={form.customer_age} onChange={(e) => setForm({ ...form, customer_age: e.target.value })} />
                </div>
                <div>
                  <Label>Bil. peserta *</Label>
                  <Input required type="number" min={1} max={selectedSlot?.seats_left ?? 50} className="mt-1.5" value={form.num_pax} onChange={(e) => setForm({ ...form, num_pax: Number(e.target.value) })} />
                </div>
              </div>

              {participantsCount > 0 && (
                <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3">
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Maklumat peserta ({participantsCount})
                  </p>
                  <div className="space-y-2">
                    {participants.map((p, i) => {
                      const isBooker = isParticipant && i === 0;
                      return (
                        <div key={i} className="grid grid-cols-[1fr_90px] gap-2">
                          <Input
                            placeholder={`Nama peserta ${i + 1}`}
                            maxLength={200}
                            value={p.name}
                            disabled={isBooker}
                            onChange={(e) => {
                              const next = [...participants];
                              next[i] = { ...next[i], name: e.target.value };
                              setParticipants(next);
                            }}
                          />
                          <Input
                            type="number"
                            min={1}
                            max={120}
                            placeholder="Umur"
                            value={p.age}
                            disabled={isBooker}
                            onChange={(e) => {
                              const next = [...participants];
                              next[i] = { ...next[i], age: e.target.value };
                              setParticipants(next);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>E-mel *</Label>
                  <Input required type="email" className="mt-1.5" value={form.email} disabled={lockedEmail} readOnly={lockedEmail} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  {lockedEmail && <p className="mt-1 text-xs text-muted-foreground">Kemas kini di Profil Saya</p>}
                </div>
                <div>
                  <Label>Telefon *</Label>
                  <Input required className="mt-1.5" value={form.phone} disabled={lockedPhone} readOnly={lockedPhone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  {lockedPhone && <p className="mt-1 text-xs text-muted-foreground">Kemas kini di Profil Saya</p>}
                </div>
              </div>
              <div>
                <Label>Syarikat (pilihan)</Label>
                <Input className="mt-1.5" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <Label>Nota tambahan</Label>
                <Textarea rows={2} className="mt-1.5" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-secondary/40 px-4 py-3">
                <div>
                  <Label className="text-xs">Kod Promo (pilihan)</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="cth: PROMO10"
                      className="font-mono uppercase"
                      disabled={!!promo}
                    />
                    {promo ? (
                      <Button type="button" variant="outline" onClick={() => { setPromo(null); setPromoInput(""); }}>
                        Buang
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={applyPromo} disabled={validatingPromo || !promoInput}>
                        {validatingPromo ? "Menyemak..." : "Guna"}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subjumlah</span>
                  <span>RM{total.toLocaleString()}</span>
                </div>
                {promo && (
                  <div className="flex items-center justify-between text-sm text-success">
                    <span>Diskaun ({promo.code})</span>
                    <span>− RM{promo.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-sm text-muted-foreground">Jumlah</span>
                  <span className="font-display text-xl font-bold text-primary">RM{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Memproses..." : "Hantar Tempahan"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Pasukan kami akan hubungi anda untuk pengesahan & arahan bayaran.</p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CourseDetail;
