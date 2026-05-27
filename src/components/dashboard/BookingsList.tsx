import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type ListableBooking = {
  id: string;
  ref_no: string;
  customer_name: string;
  payment_status: string;
  booking_status: string;
  course_title?: string;
  slot_label?: string;
  room_name?: string;
  booking_date_from?: string | null;
  booking_date_to?: string | null;
};

type Props<T extends ListableBooking> = {
  items: T[];
  renderItem: (b: T) => React.ReactNode;
  getTitle: (b: T) => string;
  getSubtitle?: (b: T) => string | undefined;
  emptySearchText?: string;
};

export function BookingsList<T extends ListableBooking>({
  items,
  renderItem,
  getTitle,
  getSubtitle,
  emptySearchText = "Tiada tempahan sepadan dengan carian.",
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [perPage, setPerPage] = useState<number>(5);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((b) => {
      if (paymentFilter !== "all" && b.payment_status !== paymentFilter) return false;
      if (statusFilter !== "all" && b.booking_status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        b.ref_no,
        b.customer_name,
        getTitle(b),
        getSubtitle?.(b) ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search, paymentFilter, statusFilter, getTitle, getSubtitle]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * perPage;
  const paged = filtered.slice(startIdx, startIdx + perPage);

  const handlePerPageChange = (v: string) => {
    setPerPage(Number(v));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari rujukan, nama atau tajuk..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={paymentFilter}
            onValueChange={(v) => {
              setPaymentFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Bayaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Bayaran</SelectItem>
              <SelectItem value="paid">Dibayar</SelectItem>
              <SelectItem value="unpaid">Belum Bayar</SelectItem>
              <SelectItem value="refunded">Dipulang</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="confirmed">Disahkan</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="cancelled">Dibatal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          {emptySearchText}
        </div>
      ) : (
        <div className="space-y-3">{paged.map((b) => renderItem(b))}</div>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Tunjuk</span>
          <Select value={String(perPage)} onValueChange={handlePerPageChange}>
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>setiap halaman</span>
          {filtered.length > 0 && (
            <span className="ml-2">
              ({startIdx + 1}–{Math.min(startIdx + perPage, filtered.length)} drpd {filtered.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            ← Sebelum
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Seterusnya →
          </Button>
        </div>
      </div>
    </div>
  );
}
