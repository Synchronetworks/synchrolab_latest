import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const empty: Omit<Testimonial, "id"> = {
  name: "",
  role: "",
  text: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

export default function TestimonialsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", deleteId);
    if (error) toast.error("Gagal padam", { description: error.message });
    else {
      toast.success("Testimoni dipadam");
      qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
      qc.invalidateQueries({ queryKey: ["public-testimonials"] });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Testimoni</h1>
          <p className="text-sm text-muted-foreground">
            Urus testimoni pelanggan yang dipaparkan di halaman utama.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} variant="accent">
          <Plus className="h-4 w-4" /> Tambah Testimoni
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Susunan</TableHead>
                <TableHead className="w-16">Gambar</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jawatan</TableHead>
                <TableHead>Testimoni</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground">{t.sort_order}</TableCell>
                  <TableCell>
                    {t.image_url ? (
                      <img src={t.image_url} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                        {t.name.slice(0, 1)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.role}</TableCell>
                  <TableCell className="max-w-md truncate text-sm text-muted-foreground">{t.text}</TableCell>
                  <TableCell>{t.is_active ? "✅" : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Belum ada testimoni.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {(creating || editing) && (
        <TestimonialForm
          initial={editing ?? { ...empty, id: "" }}
          isNew={creating}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
            qc.invalidateQueries({ queryKey: ["public-testimonials"] });
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam testimoni?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak boleh diundur.</AlertDialogDescription>
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

function TestimonialForm({ initial, isNew, onClose, onSaved }: { initial: Testimonial; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Testimonial>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `testimonials/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("catalog-images").upload(path, file, { upsert: false });
    if (upErr) {
      setUploading(false);
      toast.error("Gagal muat naik", { description: upErr.message });
      return;
    }
    const { data } = supabase.storage.from("catalog-images").getPublicUrl(path);
    setForm({ ...form, image_url: data.publicUrl });
    setUploading(false);
    toast.success("Gambar dimuat naik");
  };

  const save = async () => {
    if (!form.name || !form.role || !form.text) {
      toast.error("Sila isi nama, jawatan dan testimoni");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      role: form.role,
      text: form.text,
      image_url: form.image_url || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };
    const { error } = isNew
      ? await supabase.from("testimonials").insert(payload)
      : await supabase.from("testimonials").update(payload).eq("id", form.id);
    setSaving(false);
    if (error) {
      toast.error("Gagal menyimpan", { description: error.message });
      return;
    }
    toast.success(isNew ? "Testimoni dicipta" : "Testimoni dikemas kini");
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Tambah Testimoni" : "Edit Testimoni"}</DialogTitle>
          <DialogDescription>Testimoni akan dipaparkan di halaman utama.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nama *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth: Aizat Rahman" />
            </div>
            <div>
              <Label>Susunan</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>Jawatan / Syarikat *</Label>
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="cth: IT Manager, Petronas" />
          </div>
          <div>
            <Label>Testimoni *</Label>
            <Textarea rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          </div>
          <div>
            <Label>Gambar Profil</Label>
            <div className="flex items-center gap-3">
              {form.image_url ? (
                <img src={form.image_url} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-border" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">N/A</div>
              )}
              <div className="flex-1">
                <Input
                  placeholder="URL gambar atau muat naik"
                  value={form.image_url ?? ""}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                />
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent/10">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                />
              </label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Aktif (paparkan di laman utama)
          </label>
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
