import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Upload, X } from "lucide-react";
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
import { uploadCatalogImage, slugify } from "@/lib/uploadImage";

type SeatingLayout = { name: string; capacity: number };

type Room = {
  id: string;
  slug: string;
  name: string;
  capacity: number;
  hourly_rate: number;
  daily_rate: number;
  facilities: string[];
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  seating_layouts: SeatingLayout[];
};

const DEFAULT_LAYOUTS = ["Theater", "Classroom", "U-Shape", "Boardroom", "Banquet", "Cluster"];

const empty: Omit<Room, "id"> = {
  slug: "",
  name: "",
  capacity: 10,
  hourly_rate: 0,
  daily_rate: 0,
  facilities: [],
  description: "",
  image_url: "",
  is_active: true,
  seating_layouts: [],
};

export default function RoomsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        facilities: Array.isArray(r.facilities) ? r.facilities : [],
        seating_layouts: Array.isArray(r.seating_layouts) ? r.seating_layouts : [],
      })) as Room[];
    },
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("rooms").delete().eq("id", deleteId);
    if (error) toast.error("Gagal padam", { description: error.message });
    else {
      toast.success("Bilik dipadam");
      qc.invalidateQueries({ queryKey: ["admin-rooms"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pengurusan Bilik</h1>
          <p className="text-sm text-muted-foreground">Cipta, edit dan padam bilik latihan untuk disewa.</p>
        </div>
        <Button onClick={() => setCreating(true)} variant="accent">
          <Plus className="h-4 w-4" /> Tambah Bilik
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
                <TableHead>Nama</TableHead>
                <TableHead>Kapasiti</TableHead>
                <TableHead>Kadar /jam</TableHead>
                <TableHead>Kadar /hari</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="h-12 w-16 overflow-hidden rounded bg-muted">
                      {r.image_url && <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.slug}</p>
                  </TableCell>
                  <TableCell>{r.capacity} pax</TableCell>
                  <TableCell>RM{Number(r.hourly_rate).toLocaleString()}</TableCell>
                  <TableCell>RM{Number(r.daily_rate).toLocaleString()}</TableCell>
                  <TableCell>{r.is_active ? "✅" : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rooms.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Belum ada bilik.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {(creating || editing) && (
        <RoomForm
          initial={editing ?? { ...empty, id: "" }}
          isNew={creating}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin-rooms"] });
            qc.invalidateQueries({ queryKey: ["rooms"] });
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam bilik?</AlertDialogTitle>
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

function RoomForm({ initial, isNew, onClose, onSaved }: { initial: Room; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Room>(initial);
  const [facilitiesText, setFacilitiesText] = useState(initial.facilities.join("\n"));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew && form.name && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }));
    }
  }, [form.name]); // eslint-disable-line

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadCatalogImage(file, "rooms");
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Gambar dimuat naik");
    } catch (e: any) {
      toast.error("Gagal muat naik", { description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name || !form.slug) {
      toast.error("Sila isi nama & slug");
      return;
    }
    setSaving(true);
    const payload = {
      slug: form.slug,
      name: form.name,
      capacity: form.capacity,
      hourly_rate: form.hourly_rate,
      daily_rate: form.daily_rate,
      facilities: facilitiesText.split("\n").map((s) => s.trim()).filter(Boolean),
      description: form.description || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
    };
    const { error } = isNew
      ? await supabase.from("rooms").insert(payload)
      : await supabase.from("rooms").update(payload).eq("id", form.id);
    setSaving(false);
    if (error) {
      toast.error("Gagal menyimpan", { description: error.message });
      return;
    }
    toast.success(isNew ? "Bilik dicipta" : "Bilik dikemas kini");
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Tambah Bilik" : "Edit Bilik"}</DialogTitle>
          <DialogDescription>Isi maklumat bilik latihan.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div>
            <Label>Gambar bilik</Label>
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
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
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
              <Label>Nama bilik *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Slug URL *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label>Penerangan</Label>
            <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Kapasiti (pax) *</Label>
              <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Kadar /jam (RM) *</Label>
              <Input type="number" min={0} value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Kadar /hari (RM) *</Label>
              <Input type="number" min={0} value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label>Fasiliti (satu baris satu item)</Label>
            <Textarea rows={5} value={facilitiesText} onChange={(e) => setFacilitiesText(e.target.value)}
              placeholder="WiFi laju&#10;Projektor 4K&#10;Aircond&#10;Whiteboard" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Aktif (paparkan di laman awam)
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
