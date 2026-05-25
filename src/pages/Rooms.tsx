import { useMemo, useState, useEffect } from "react";
import { Check, CheckCircle2, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRooms, useRoomAddons } from "@/hooks/useCatalog";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const schema = z.object({
  room_id: z.string().uuid("Sila pilih bilik"),
  date: z.string().min(1, "Sila masukkan tarikh"),
  duration: z.number().int().min(1).max(12),
  customer_name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

const Rooms = () => {
  const { data: rooms = [], isLoading } = useRooms();
  const { data: addons = [] } = useRoomAddons();
  const [form, setForm] = useState({ room_id: "", date: "", time: "", duration: 4, customer_name: "", email: "", phone: "", notes: "" });
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({}); // id -> qty
  const [submitting, setSubmitting] = useState(false);
  const [refNo, setRefNo] = useState<string | null>(null);

  useEffect(() => {
    if (!form.room_id && rooms.length > 0) setForm((f) => ({ ...f, room_id: rooms[0].id }));
  }, [rooms, form.room_id]);

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
      setForm((f) => ({
        ...f,
        customer_name: f.customer_name || profile?.full_name || "",
        email: f.email || session.user.email || "",
        phone: f.phone || profile?.phone || "",
      }));
    })();
  }, []);

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === form.room_id), [rooms, form.room_id]);

  const baseTotal = useMemo(() => {
    if (!selectedRoom) return 0;
    if (form.duration >= 8) return selectedRoom.daily_rate;
    return selectedRoom.hourly_rate * form.duration;
  }, [selectedRoom, form.duration]);

  const addonsTotal = useMemo(() => {
    return addons.reduce((sum, a) => sum + (selectedAddons[a.id] || 0) * a.price, 0);
  }, [addons, selectedAddons]);

  const total = baseTotal + addonsTotal;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { data: ref, error } = await supabase.rpc("create_booking", {
      _type: "room",
      _customer_name: parsed.data.customer_name,
      _email: parsed.data.email,
      _phone: parsed.data.phone,
      _num_pax: 1,
      _total_amount: total,
      _room_id: parsed.data.room_id,
      _booking_date_from: parsed.data.date,
      _booking_date_to: parsed.data.date,
      _notes: buildNotes(),
    });
    if (error || !ref) {
      setSubmitting(false);
      toast.error("Gagal menempah", { description: error?.message ?? "Ralat tidak diketahui" });
      return;
    }

    toast.info("Menyediakan laman bayaran...");
    const { data: billData, error: billErr } = await supabase.functions.invoke("create-billplz-bill", {
      body: { ref_no: ref, email: parsed.data.email },
    });
    setSubmitting(false);
    if (billErr || !billData?.url) {
      toast.error("Tempahan berjaya tetapi gagal buka laman bayaran", {
        description: `Sila ke Dashboard untuk teruskan bayaran. Ref: ${ref}`,
      });
      setRefNo(ref as string);
      return;
    }
    setForm({ room_id: rooms[0]?.id ?? "", date: "", time: "", duration: 4, customer_name: "", email: "", phone: "", notes: "" });
    setSelectedAddons({});
    window.location.href = billData.url;
  };

  const buildNotes = () => {
    const chosen = addons
      .filter((a) => (selectedAddons[a.id] || 0) > 0)
      .map((a) => `${a.name} x${selectedAddons[a.id]} (RM${(selectedAddons[a.id] * a.price).toFixed(2)})`);
    const parts: string[] = [
      `Masa: ${form.time || "-"}`,
      `Tempoh: ${form.duration} jam`,
    ];
    if (chosen.length) parts.push(`Add-on: ${chosen.join(", ")}`);
    if (form.notes) parts.push(form.notes);
    return parts.join(" • ");
  };

  return (
    <>
      <section className="bg-gradient-hero py-16">
        <div className="container">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent/90">Sewa Bilik Latihan</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold text-white md:text-5xl">Ruang latihan moden untuk acara anda</h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Daripada workshop kecil hingga seminar berskala besar — pilih bilik yang sesuai dengan keperluan anda.
          </p>
        </div>
      </section>

      <section className="container py-14">
        {isLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {rooms.map((r) => (
              <div key={r.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-smooth hover:shadow-elegant">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={r.image} alt={r.name} loading="lazy" width={1200} height={800} className="h-full w-full object-cover transition-smooth hover:scale-105" />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold text-foreground">{r.name}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                      <Users className="h-3 w-3" /> {r.capacity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>

                  <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-foreground/80">
                    {r.facilities.map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-success" /> {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Per jam / hari</p>
                      <p className="font-display text-lg font-bold text-primary">
                        RM{r.hourly_rate} <span className="text-sm font-normal text-muted-foreground">/ RM{r.daily_rate}</span>
                      </p>
                    </div>
                    <Button size="sm" variant="accent" onClick={() => { setForm((f) => ({ ...f, room_id: r.id })); document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" }); }}>
                      Tempah
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking form */}
      <section id="booking-form" className="bg-gradient-soft py-16">
        <div className="container max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">Borang Tempahan Bilik</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground">Semak ketersediaan & tempah</h2>
          </div>

          {refNo && (
            <div className="mx-auto mt-8 max-w-xl rounded-xl border border-success/30 bg-success/5 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <p className="mt-2 font-display text-lg font-bold text-foreground">Tempahan diterima!</p>
              <p className="mt-1 text-sm text-muted-foreground">Nombor rujukan: <span className="font-bold text-primary">{refNo}</span></p>
            </div>
          )}

          <form onSubmit={submit} className="mt-10 grid gap-5 rounded-2xl border border-border bg-card p-8 shadow-soft md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Bilik latihan</Label>
              <select required value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} (kapasiti {r.capacity})</option>)}
              </select>
            </div>

            <div>
              <Label>Tarikh</Label>
              <Input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Masa mula</Label>
              <Input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Tempoh (jam) — 8 jam = kadar harian</Label>
              <Input required type="number" min={1} max={12} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="mt-1.5" />
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-lg border border-border bg-secondary/40 px-4 py-2.5">
                <p className="text-xs text-muted-foreground">Anggaran jumlah {addonsTotal > 0 && <span className="text-foreground/60">(termasuk add-on RM{addonsTotal.toFixed(2)})</span>}</p>
                <p className="font-display text-lg font-bold text-primary">RM{total.toLocaleString()}</p>
              </div>
            </div>

            {addons.length > 0 && (
              <div className="md:col-span-2">
                <Label>Keperluan khas (add-on)</Label>
                <p className="mt-1 text-xs text-muted-foreground">Pilih item tambahan — harga akan ditambah ke jumlah tempahan.</p>
                <div className="mt-3 grid gap-2 rounded-lg border border-border bg-background/50 p-3 sm:grid-cols-2">
                  {addons.map((a) => {
                    const qty = selectedAddons[a.id] || 0;
                    return (
                      <div key={a.id} className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2">
                        <Checkbox
                          checked={qty > 0}
                          onCheckedChange={(v) =>
                            setSelectedAddons((s) => ({ ...s, [a.id]: v ? Math.max(1, qty) : 0 }))
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight">{a.name}</p>
                          {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                          <p className="mt-0.5 text-xs text-primary font-semibold">RM{a.price.toFixed(2)}</p>
                        </div>
                        {qty > 0 && (
                          <Input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => setSelectedAddons((s) => ({ ...s, [a.id]: Math.max(1, Number(e.target.value)) }))}
                            className="h-8 w-16"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <Label>Nama penuh</Label>
              <Input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>E-mel</Label>
              <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
            </div>
            <div className="md:col-span-2">
              <Label>Nota tambahan</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1.5" placeholder="Cth: keperluan khas lain, susunan kerusi..." />
            </div>
            <Button type="submit" variant="accent" size="lg" className="md:col-span-2" disabled={submitting}>
              {submitting ? "Memproses..." : "Hantar Permohonan Tempahan"}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
};

export default Rooms;
