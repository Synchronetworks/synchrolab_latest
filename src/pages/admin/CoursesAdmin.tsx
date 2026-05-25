import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Upload, X, CalendarPlus, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { uploadCatalogImage, slugify } from "@/lib/uploadImage";

type Course = {
  id: string;
  slug: string;
  title: string;
  category: string;
  duration: string;
  price: number;
  group_price: number | null;
  status: "Ada Tempat" | "Hampir Penuh" | "Penuh";
  short_desc: string;
  syllabus: string[];
  prerequisites: string | null;
  facilitator: string | null;
  certificate: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
};

type Slot = {
  id: string;
  course_id: string;
  date_label: string;
  time_label: string;
  seats_total: number;
  seats_taken: number;
  sort_order: number;
};

const empty: Omit<Course, "id"> = {
  slug: "",
  title: "",
  category: "Office Productivity",
  duration: "",
  price: 0,
  group_price: null,
  status: "Ada Tempat",
  short_desc: "",
  syllabus: [],
  prerequisites: "",
  facilitator: "",
  certificate: "",
  image_url: "",
  is_active: true,
  is_featured: false,
};

export default function CoursesAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [slotsFor, setSlotsFor] = useState<Course | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Course[];
    },
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("courses").delete().eq("id", deleteId);
    if (error) toast.error("Gagal padam", { description: error.message });
    else {
      toast.success("Kursus dipadamkan");
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pengurusan Kursus</h1>
          <p className="text-sm text-muted-foreground">Cipta, edit dan padam kursus yang dipaparkan di laman utama.</p>
        </div>
        <Button onClick={() => setCreating(true)} variant="accent">
          <Plus className="h-4 w-4" /> Tambah Kursus
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gambar</TableHead>
                <TableHead>Tajuk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead>Pilihan</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="h-12 w-16 overflow-hidden rounded bg-muted">
                      {c.image_url && <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.slug}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                  <TableCell>RM{Number(c.price).toLocaleString()}</TableCell>
                  <TableCell><Badge>{c.status}</Badge></TableCell>
                  <TableCell>{c.is_active ? "✅" : "—"}</TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={c.is_featured}
                      title="Tick untuk paparkan di 'Kursus popular bulan ini'"
                      onChange={async (e) => {
                        const { error } = await supabase
                          .from("courses")
                          .update({ is_featured: e.target.checked })
                          .eq("id", c.id);
                        if (error) toast.error("Gagal", { description: error.message });
                        else {
                          toast.success(e.target.checked ? "Dipilih" : "Dibuang dari pilihan");
                          qc.invalidateQueries({ queryKey: ["admin-courses"] });
                          qc.invalidateQueries({ queryKey: ["courses"] });
                          qc.invalidateQueries({ queryKey: ["featured-courses"] });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSlotsFor(c)} title="Slot tarikh">
                        <CalendarPlus className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {courses.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Belum ada kursus.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {(creating || editing) && (
        <CourseForm
          initial={editing ?? { ...empty, id: "" }}
          isNew={creating}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin-courses"] });
            qc.invalidateQueries({ queryKey: ["courses"] });
          }}
        />
      )}

      {slotsFor && <SlotsManager course={slotsFor} onClose={() => setSlotsFor(null)} />}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam kursus?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak boleh diundur. Slot dan tempahan berkaitan mungkin terjejas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Padam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CourseForm({ initial, isNew, onClose, onSaved }: { initial: Course; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Course>(initial);
  const [syllabusText, setSyllabusText] = useState(initial.syllabus.join("\n"));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew && form.title && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title]); // eslint-disable-line

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadCatalogImage(file, "courses");
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Gambar dimuat naik");
    } catch (e: any) {
      toast.error("Gagal muat naik", { description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title || !form.slug || !form.short_desc || !form.duration) {
      toast.error("Sila isi semua medan wajib");
      return;
    }
    setSaving(true);
    const payload = {
      slug: form.slug,
      title: form.title,
      category: form.category,
      duration: form.duration,
      price: form.price,
      group_price: form.group_price,
      status: form.status,
      short_desc: form.short_desc,
      syllabus: syllabusText.split("\n").map((s) => s.trim()).filter(Boolean),
      prerequisites: form.prerequisites || null,
      facilitator: form.facilitator || null,
      certificate: form.certificate || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
    };
    const { error } = isNew
      ? await supabase.from("courses").insert(payload)
      : await supabase.from("courses").update(payload).eq("id", form.id);
    setSaving(false);
    if (error) {
      toast.error("Gagal menyimpan", { description: error.message });
      return;
    }
    toast.success(isNew ? "Kursus dicipta" : "Kursus dikemas kini");
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Tambah Kursus" : "Edit Kursus"}</DialogTitle>
          <DialogDescription>Isi maklumat kursus. Medan bertanda * adalah wajib.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div>
            <Label>Gambar kursus</Label>
            <div className="mt-2 flex items-start gap-4">
              <div className="h-32 w-48 overflow-hidden rounded-lg border border-border bg-muted">
                {form.image_url ? (
                  <img src={form.image_url} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Tiada gambar</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="https://... atau muat naik di bawah"
                  value={form.image_url ?? ""}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                />
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    />
                    <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Muat naik
                    </span>
                  </label>
                  {form.image_url && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, image_url: "" })}>
                      <X className="h-4 w-4" /> Buang
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tajuk *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Slug URL *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label>Penerangan ringkas *</Label>
            <Textarea rows={2} value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Kategori *</Label>
              <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Office Productivity</option>
                <option>Cybersecurity</option>
                <option>AI & Data</option>
                <option>Networking</option>
                <option>Cloud</option>
                <option>Pengurusan</option>
              </select>
            </div>
            <div>
              <Label>Tempoh (hari) *</Label>
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="cth: 2"
                value={form.duration.replace(/\D/g, "")}
                onChange={(e) => {
                  const n = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, duration: n ? `${n} hari` : "" });
                }}
              />
            </div>
            <div>
              <Label>Status</Label>
              <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Course["status"] })}>
                <option>Ada Tempat</option>
                <option>Hampir Penuh</option>
                <option>Penuh</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Harga (RM) *</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Harga kumpulan 5+ (RM)</Label>
              <Input type="number" min={0} value={form.group_price ?? ""} onChange={(e) => setForm({ ...form, group_price: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>

          <div>
            <Label>Silibus (satu baris satu poin)</Label>
            <Textarea rows={5} value={syllabusText} onChange={(e) => setSyllabusText(e.target.value)} placeholder="Pengenalan&#10;Modul 1: ...&#10;Modul 2: ..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kelayakan peserta</Label>
              <Input value={form.prerequisites ?? ""} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} />
            </div>
            <div>
              <Label>Fasilitator</Label>
              <Input value={form.facilitator ?? ""} onChange={(e) => setForm({ ...form, facilitator: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Sijil</Label>
            <Input value={form.certificate ?? ""} onChange={(e) => setForm({ ...form, certificate: e.target.value })} />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Aktif (paparkan di laman awam)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              Highlight di "Kursus popular bulan ini"
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="accent" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isNew ? "Cipta" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlotsManager({ course, onClose }: { course: Course; onClose: () => void }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({ date_label: "", time_label: "", seats_total: 20 });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const formatTime12 = (hhmm: string): string => {
    if (!hhmm) return "";
    const [hStr, mStr] = hhmm.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    const period = h < 12 ? "pagi" : h < 19 ? "petang" : "malam";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  };

  const buildTimeLabel = (start: string, end: string) => {
    const s = formatTime12(start);
    const e = formatTime12(end);
    if (s && e) return `${s} - ${e}`;
    return s || e;
  };

  const formatDateRange = (range: DateRange | undefined): string => {
    if (!range?.from) return "";
    const from = range.from;
    const to = range.to;
    if (!to || from.getTime() === to.getTime()) {
      return format(from, "d MMMM yyyy", { locale: ms });
    }
    const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
    const sameYear = from.getFullYear() === to.getFullYear();
    if (sameMonth) {
      return `${format(from, "d", { locale: ms })}-${format(to, "d MMMM yyyy", { locale: ms })}`;
    }
    if (sameYear) {
      return `${format(from, "d MMM", { locale: ms })} - ${format(to, "d MMM yyyy", { locale: ms })}`;
    }
    return `${format(from, "d MMM yyyy", { locale: ms })} - ${format(to, "d MMM yyyy", { locale: ms })}`;
  };

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["admin-slots", course.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_slots")
        .select("*")
        .eq("course_id", course.id)
        .order("sort_order");
      if (error) throw error;
      return data as Slot[];
    },
  });

  const addSlot = async () => {
    if (!newSlot.date_label || !newSlot.time_label) {
      toast.error("Sila isi tarikh dan masa");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("course_slots").insert({
      course_id: course.id,
      date_label: newSlot.date_label,
      time_label: newSlot.time_label,
      seats_total: newSlot.seats_total,
      sort_order: slots.length,
    });
    setAdding(false);
    if (error) toast.error("Gagal", { description: error.message });
    else {
      toast.success("Slot ditambah");
      setNewSlot({ date_label: "", time_label: "", seats_total: 20 });
      setDateRange(undefined);
      qc.invalidateQueries({ queryKey: ["admin-slots", course.id] });
    }
  };

  const deleteSlot = async (id: string) => {
    const { error } = await supabase.from("course_slots").delete().eq("id", id);
    if (error) toast.error("Gagal", { description: error.message });
    else {
      toast.success("Slot dipadam");
      qc.invalidateQueries({ queryKey: ["admin-slots", course.id] });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Slot Tarikh — {course.title}</DialogTitle>
          <DialogDescription>Urus tarikh-tarikh kursus yang dibuka untuk pendaftaran.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarikh</TableHead>
                    <TableHead>Masa</TableHead>
                    <TableHead>Tempat</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.date_label}</TableCell>
                      <TableCell>{s.time_label}</TableCell>
                      <TableCell>{s.seats_taken}/{s.seats_total}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => deleteSlot(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {slots.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Belum ada slot.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="mb-3 text-sm font-medium">Tambah slot baru</p>
            <div className="grid grid-cols-3 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !newSlot.date_label && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newSlot.date_label || "Pilih tarikh"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      setNewSlot({ ...newSlot, date_label: formatDateRange(range) });
                    }}
                    numberOfMonths={1}
                    locale={ms}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Input placeholder="cth: 9:00 pagi - 5:00 petang" value={newSlot.time_label} onChange={(e) => setNewSlot({ ...newSlot, time_label: e.target.value })} />
              <Input type="number" min={1} placeholder="Tempat" value={newSlot.seats_total} onChange={(e) => setNewSlot({ ...newSlot, seats_total: Number(e.target.value) })} />
            </div>
            <Button onClick={addSlot} disabled={adding} variant="accent" size="sm" className="mt-3">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tambah Slot
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
