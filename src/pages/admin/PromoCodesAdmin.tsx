import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type DiscountType = "percent" | "fixed";
type AppliesTo = "all" | "course" | "room";

type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  applies_to: AppliesTo;
  first_time_only: boolean;
  max_uses: number | null;
  used_count: number;
  min_amount: number;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
};

const empty: Omit<PromoCode, "id" | "used_count"> = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  applies_to: "all",
  first_time_only: false,
  max_uses: null,
  min_amount: 0,
  max_discount: null,
  starts_at: null,
  expires_at: null,
  is_active: true,
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function PromoCodesAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["admin-promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoCode[];
    },
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", deleteId);
    if (error) toast.error("Gagal padam", { description: error.message });
    else {
      toast.success("Kod promo dipadam");
      qc.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Kod Promo</h1>
          <p className="text-sm text-muted-foreground">
            Jana kod promo dengan diskaun peratus/tetap. Boleh hadkan untuk pengguna kali pertama atau tempoh tertentu.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} variant="accent">
          <Plus className="h-4 w-4" /> Tambah Kod
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Diskaun</TableHead>
                <TableHead>Skop</TableHead>
                <TableHead>Tempoh</TableHead>
                <TableHead>Guna</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-mono font-semibold">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      {p.code}
                    </div>
                    {p.description && <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>}
                  </TableCell>
                  <TableCell>
                    {p.discount_type === "percent" ? `${p.discount_value}%` : `RM${Number(p.discount_value).toLocaleString()}`}
                    {p.first_time_only && <Badge variant="secondary" className="ml-2">1st-time</Badge>}
                  </TableCell>
                  <TableCell className="capitalize">
                    {p.applies_to === "all" ? "Semua" : p.applies_to === "course" ? "Kursus" : "Bilik"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.starts_at || p.expires_at ? (
                      <>
                        {p.starts_at ? new Date(p.starts_at).toLocaleDateString() : "—"}
                        {" → "}
                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "∞"}
                      </>
                    ) : (
                      "Tiada had"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.used_count}{p.max_uses ? `/${p.max_uses}` : ""}
                  </TableCell>
                  <TableCell>{p.is_active ? <Badge>Aktif</Badge> : <Badge variant="outline">Tidak aktif</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {promos.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Belum ada kod promo.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {(creating || editing) && (
        <PromoForm
          initial={editing ?? { ...empty, id: "", used_count: 0 }}
          isNew={creating}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-promo-codes"] })}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam kod promo?</AlertDialogTitle>
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

function PromoForm({ initial, isNew, onClose, onSaved }: { initial: PromoCode; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<PromoCode>(initial);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.code || form.code.trim().length < 3) {
      toast.error("Kod mesti sekurang-kurangnya 3 aksara");
      return;
    }
    if (form.discount_value <= 0) {
      toast.error("Nilai diskaun mesti lebih besar dari 0");
      return;
    }
    if (form.discount_type === "percent" && form.discount_value > 100) {
      toast.error("Diskaun peratus tidak boleh melebihi 100%");
      return;
    }
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      applies_to: form.applies_to,
      first_time_only: form.first_time_only,
      max_uses: form.max_uses,
      min_amount: form.min_amount,
      max_discount: form.max_discount,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    };
    const { error } = isNew
      ? await supabase.from("promo_codes").insert(payload)
      : await supabase.from("promo_codes").update(payload).eq("id", form.id);
    setSaving(false);
    if (error) {
      toast.error("Gagal menyimpan", { description: error.message });
      return;
    }
    toast.success(isNew ? "Kod promo dicipta" : "Kod promo dikemas kini");
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Tambah Kod Promo" : "Edit Kod Promo"}</DialogTitle>
          <DialogDescription>Konfigurasikan diskaun, skop, dan had penggunaan.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kod *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="cth: PROMO10"
                className="font-mono uppercase"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.is_active ? "1" : "0"} onValueChange={(v) => setForm({ ...form, is_active: v === "1" })}>
                <SelectTrigger className="mt-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Aktif</SelectItem>
                  <SelectItem value="0">Tidak aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Penerangan (untuk admin)</Label>
            <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="cth: Diskaun pelancaran" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Jenis Diskaun *</Label>
              <Select value={form.discount_type} onValueChange={(v: DiscountType) => setForm({ ...form, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Peratus (%)</SelectItem>
                  <SelectItem value="fixed">Tetap (RM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nilai *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Terpakai untuk</Label>
              <Select value={form.applies_to} onValueChange={(v: AppliesTo) => setForm({ ...form, applies_to: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua tempahan</SelectItem>
                  <SelectItem value="course">Kursus sahaja</SelectItem>
                  <SelectItem value="room">Sewa bilik sahaja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah min. tempahan (RM)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.min_amount}
                onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Had penggunaan (kosongkan = tiada had)</Label>
              <Input
                type="number"
                min={1}
                value={form.max_uses ?? ""}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div>
              <Label>Diskaun maks. RM (untuk peratus)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.max_discount ?? ""}
                onChange={(e) => setForm({ ...form, max_discount: e.target.value ? Number(e.target.value) : null })}
                placeholder="Pilihan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mula</Label>
              <Input
                type="datetime-local"
                value={toLocalInput(form.starts_at)}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Tamat</Label>
              <Input
                type="datetime-local"
                value={toLocalInput(form.expires_at)}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value || null })}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
            <input
              type="checkbox"
              checked={form.first_time_only}
              onChange={(e) => setForm({ ...form, first_time_only: e.target.checked })}
            />
            <span>
              <span className="font-medium">Khas pengguna kali pertama</span>
              <span className="ml-1 text-muted-foreground">— hanya sah untuk e-mel yang belum pernah ada tempahan berbayar.</span>
            </span>
          </label>

          {!isNew && (
            <p className="text-xs text-muted-foreground">Telah digunakan: {form.used_count} kali</p>
          )}
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
