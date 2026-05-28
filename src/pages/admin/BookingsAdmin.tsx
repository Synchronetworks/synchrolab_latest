import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BookingRow = {
  id: string;
  ref_no: string;
  type: "course" | "room";
  customer_name: string;
  email: string;
  phone: string;
  company: string | null;
  notes: string | null;
  num_pax: number;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  promo_code: string | null;
  payment_status: "unpaid" | "paid" | "refunded";
  booking_status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  checked_in_at: string | null;
  booking_date_from: string | null;
  booking_date_to: string | null;
  courses: { title: string } | null;
  rooms: { name: string } | null;
  course_slots: { date_label: string; time_label: string } | null;
};

const paymentBadgeClass = (s: BookingRow["payment_status"]) => {
  switch (s) {
    case "paid":
      return "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
    case "refunded":
      return "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100";
    default:
      return "border-transparent bg-rose-100 text-rose-700 hover:bg-rose-100";
  }
};

const statusBadgeClass = (variant: "attended" | "absent" | "confirmed" | "cancelled" | "pending") => {
  switch (variant) {
    case "attended":
      return "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
    case "absent":
      return "border-transparent bg-rose-100 text-rose-700 hover:bg-rose-100";
    case "confirmed":
      return "border-transparent bg-sky-100 text-sky-700 hover:bg-sky-100";
    case "cancelled":
      return "border-transparent bg-slate-200 text-slate-700 hover:bg-slate-200";
    default:
      return "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100";
  }
};

const resolveStatus = (b: BookingRow) => {
  if (b.checked_in_at) return { variant: "attended" as const, label: "Telah Hadir" };
  if (b.booking_status === "cancelled") return { variant: "cancelled" as const, label: "Dibatal" };
  const endDateStr = b.booking_date_to ?? b.booking_date_from;
  if (endDateStr && b.payment_status === "paid") {
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    if (end.getTime() < Date.now()) {
      return { variant: "absent" as const, label: "Tidak Hadir" };
    }
  }
  if (b.booking_status === "confirmed") return { variant: "confirmed" as const, label: "Disahkan" };
  return { variant: "pending" as const, label: "Menunggu" };
};

const PAGE_SIZE = 20;

const BookingsAdmin = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<BookingRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, courses(title), rooms(name), course_slots(date_label, time_label)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as BookingRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((b) => {
      if (typeFilter !== "all" && b.type !== typeFilter) return false;
      if (paymentFilter !== "all" && b.payment_status !== paymentFilter) return false;
      if (statusFilter !== "all" && b.booking_status !== statusFilter) return false;
      if (!q) return true;
      const item = b.courses?.title ?? b.rooms?.name ?? "";
      return (
        b.ref_no.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        (b.phone ?? "").toLowerCase().includes(q) ||
        item.toLowerCase().includes(q)
      );
    });
  }, [data, search, typeFilter, paymentFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Tempahan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Senarai tempahan kursus & sewa bilik.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:flex-1 sm:min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari rujukan, nama, emel, telefon, item..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
          <SelectTrigger className="sm:w-[140px]"><SelectValue placeholder="Jenis" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua jenis</SelectItem>
            <SelectItem value="course">Kursus</SelectItem>
            <SelectItem value="room">Bilik</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); resetPage(); }}>
          <SelectTrigger className="sm:w-[160px]"><SelectValue placeholder="Bayaran" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua bayaran</SelectItem>
            <SelectItem value="paid">Dibayar</SelectItem>
            <SelectItem value="unpaid">Belum Bayar</SelectItem>
            <SelectItem value="refunded">Dipulang</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
          <SelectTrigger className="sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="confirmed">Disahkan</SelectItem>
            <SelectItem value="cancelled">Dibatal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarikh</TableHead>
              <TableHead>No. Rujukan</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Pax</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Bayaran</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">Memuatkan...</TableCell>
              </TableRow>
            )}
            {!isLoading && pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">Tiada tempahan.</TableCell>
              </TableRow>
            )}
            {pageRows.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(b.created_at), "dd MMM yyyy")}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                  >
                    {b.ref_no}
                  </button>
                </TableCell>
                <TableCell><Badge variant="outline">{b.type === "course" ? "Kursus" : "Bilik"}</Badge></TableCell>
                <TableCell>
                  <div className="font-medium">{b.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{b.email}</div>
                </TableCell>
                <TableCell className="text-sm">{b.courses?.title ?? b.rooms?.name ?? "—"}</TableCell>
                <TableCell>{b.num_pax}</TableCell>
                <TableCell className="font-medium">RM {Number(b.total_amount).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={paymentBadgeClass(b.payment_status)}>
                    {b.payment_status === "paid" ? "Dibayar" : b.payment_status === "refunded" ? "Dipulang" : "Belum Bayar"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {(() => {
                    const s = resolveStatus(b);
                    return <Badge className={statusBadgeClass(s.variant)}>{s.label}</Badge>;
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {filtered.length === 0
            ? "0 tempahan"
            : `Menunjukkan ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} daripada ${filtered.length}`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" /> Sebelum
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Seterusnya <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (() => {
            const s = resolveStatus(selected);
            const item = selected.courses?.title ?? selected.rooms?.name ?? "—";
            const slot = selected.course_slots
              ? `${selected.course_slots.date_label} • ${selected.course_slots.time_label}`
              : null;
            const fmt = (d: string | null) => (d ? format(new Date(d), "dd MMM yyyy") : null);
            const dateRange = selected.booking_date_from
              ? selected.booking_date_to && selected.booking_date_to !== selected.booking_date_from
                ? `${fmt(selected.booking_date_from)} – ${fmt(selected.booking_date_to)}`
                : fmt(selected.booking_date_from)
              : null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-mono text-base">{selected.ref_no}</DialogTitle>
                  <DialogDescription>
                    {selected.type === "course" ? "Tempahan Kursus" : "Sewa Bilik"} • {format(new Date(selected.created_at), "dd MMM yyyy, h:mm a")}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap gap-2">
                  <Badge className={paymentBadgeClass(selected.payment_status)}>
                    {selected.payment_status === "paid" ? "Dibayar" : selected.payment_status === "refunded" ? "Dipulang" : "Belum Bayar"}
                  </Badge>
                  <Badge className={statusBadgeClass(s.variant)}>{s.label}</Badge>
                  {selected.checked_in_at && (
                    <span className="text-xs text-muted-foreground">
                      Check-in: {format(new Date(selected.checked_in_at), "dd MMM yyyy, h:mm a")}
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <Section title="Pelanggan">
                    <Row label="Nama" value={selected.customer_name} />
                    <Row label="Emel" value={selected.email} />
                    <Row label="Telefon" value={selected.phone} />
                    {selected.company && <Row label="Syarikat" value={selected.company} />}
                  </Section>

                  <Section title={selected.type === "course" ? "Kursus" : "Bilik"}>
                    <Row label="Item" value={item} />
                    {slot && <Row label="Slot" value={slot} />}
                    {dateRange && <Row label="Tarikh" value={dateRange} />}
                    <Row label="Pax" value={String(selected.num_pax)} />
                  </Section>

                  <Section title="Bayaran">
                    <Row label="Subtotal" value={`RM ${Number(selected.subtotal_amount).toFixed(2)}`} />
                    {Number(selected.discount_amount) > 0 && (
                      <Row
                        label={`Diskaun${selected.promo_code ? ` (${selected.promo_code})` : ""}`}
                        value={`- RM ${Number(selected.discount_amount).toFixed(2)}`}
                      />
                    )}
                    <Row
                      label="Jumlah"
                      value={`RM ${Number(selected.total_amount).toFixed(2)}`}
                      bold
                    />
                  </Section>

                  {selected.notes && (
                    <Section title="Nota">
                      <p className="whitespace-pre-wrap text-muted-foreground">{selected.notes}</p>
                    </Section>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-3">
    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className={bold ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
  </div>
);

export default BookingsAdmin;
