import { useState } from "react";
import { CheckCircle2, FileSearch, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { downloadBookingReceipt } from "@/lib/receipt";

type BookingResult = {
  ref_no: string;
  type: "course" | "room";
  customer_name: string;
  email: string;
  num_pax: number;
  total_amount: number;
  subtotal_amount: number | null;
  discount_amount: number | null;
  promo_code: string | null;
  payment_status: "unpaid" | "paid" | "refunded";
  booking_status: "pending" | "confirmed" | "cancelled";
  booking_date_from: string | null;
  booking_date_to: string | null;
  course_title: string | null;
  slot_label: string | null;
  room_name: string | null;
  created_at: string;
};

const paymentLabel = (s: string) =>
  s === "paid" ? "Dibayar" : s === "refunded" ? "Dipulang" : "Belum Bayar";
const statusLabel = (s: string) =>
  s === "confirmed" ? "Disahkan" : s === "cancelled" ? "Dibatal" : "Menunggu";

const CheckBooking = () => {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("lookup_booking", {
        _ref: ref.trim(),
        _email: email.trim(),
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setError("Tempahan tidak dijumpai. Pastikan no. rujukan dan e-mel betul.");
      } else {
        setResult(row as BookingResult);
      }
    } catch (err: any) {
      setError(err?.message ?? "Ralat semakan tempahan.");
    } finally {
      setLoading(false);
    }
  };

  const itemName = result
    ? result.course_title ?? result.room_name ?? "—"
    : "";
  const dateLabel = result
    ? result.slot_label ??
      ([result.booking_date_from, result.booking_date_to].filter(Boolean).join(" – ") || "—")
    : "";

  const downloadReceipt = () => {
    if (!result) return;
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString("ms-MY");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("RESIT RASMI", 105, 25, { align: "center" });
    doc.setFontSize(12);
    doc.text("SynchroLab.my", 105, 33, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Synchronetwork Sdn. Bhd. (1194790-K)", 105, 39, { align: "center" });
    doc.text("79A, Jalan Nova U5/N, Subang Bestari Sek. U5, 40150 Shah Alam, Selangor", 105, 44, { align: "center" });
    doc.setDrawColor(180);
    doc.line(20, 50, 190, 50);

    doc.setFontSize(11);
    doc.text(`No. Rujukan: ${result.ref_no}`, 20, 60);
    doc.text(`Tarikh Resit: ${today}`, 20, 67);
    doc.text(`Pelanggan: ${result.customer_name}`, 20, 74);
    doc.text(`Status Bayaran: ${paymentLabel(result.payment_status)}`, 20, 81);

    doc.setFont("helvetica", "bold");
    doc.text("Butiran Tempahan", 20, 95);
    doc.setFont("helvetica", "normal");
    doc.text(result.type === "course" ? "Kursus:" : "Bilik:", 20, 105);
    doc.text(itemName, 60, 105);
    doc.text("Tarikh:", 20, 112);
    doc.text(dateLabel || "—", 60, 112);

    doc.line(20, 125, 190, 125);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Jumlah Dibayar:", 20, 135);
    doc.text(`RM ${Number(result.total_amount).toFixed(2)}`, 190, 135, { align: "right" });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Terima kasih kerana menggunakan SynchroLab.my", 105, 280, { align: "center" });
    doc.save(`Resit-${result.ref_no}.pdf`);
  };

  const downloadCertificate = () => {
    if (!result) return;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setDrawColor(30, 64, 100);
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 267, 180);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(30, 64, 100);
    doc.text("SIJIL PENYERTAAN", 148.5, 45, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text("Adalah dengan ini disahkan bahawa", 148.5, 70, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(20);
    doc.text(result.customer_name, 148.5, 88, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text("telah berjaya menyertai dan menamatkan kursus", 148.5, 105, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 100);
    doc.text(itemName, 148.5, 122, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`pada ${dateLabel || "-"}`, 148.5, 135, { align: "center" });

    doc.setDrawColor(150);
    doc.line(50, 170, 110, 170);
    doc.line(187, 170, 247, 170);
    doc.setFontSize(10);
    doc.text("Pengarah Latihan", 80, 178, { align: "center" });
    doc.text("SynchroLab.my", 217, 178, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`No. Sijil: ${result.ref_no}`, 148.5, 192, { align: "center" });
    doc.save(`Sijil-${result.ref_no}.pdf`);
  };

  const isPaid = result?.payment_status === "paid";

  return (
    <>
      <section className="bg-gradient-hero py-16">
        <div className="container max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <FileSearch className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold text-white">Semak Status Tempahan</h1>
          <p className="mt-3 text-white/80">
            Masukkan nombor rujukan dan e-mel anda untuk semak status tempahan, muat turun resit dan sijil.
          </p>
        </div>
      </section>

      <section className="container max-w-2xl py-14 pt-0 -mt-[60px]">
        <form onSubmit={handleCheck} className="rounded-2xl border border-border bg-card p-8 shadow-soft space-y-4">
          <div>
            <Label htmlFor="ref">Nombor rujukan</Label>
            <Input
              id="ref"
              placeholder="SYL-2025-000001"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">E-mel</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              required
            />
          </div>
          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
            {loading ? "Menyemak..." : "Semak Tempahan"}
          </Button>
        </form>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-foreground">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
              <div className="flex-1">
                <p className="font-display text-lg font-bold text-foreground">Tempahan dijumpai</p>
                <p className="text-xs text-muted-foreground">Rujukan: {result.ref_no}</p>

                <dl className="mt-4 grid gap-2 text-sm">
                  <div className="flex justify-between border-b border-border/50 py-1.5">
                    <dt className="text-muted-foreground">Status bayaran</dt>
                    <dd className={`font-semibold ${isPaid ? "text-success" : "text-foreground"}`}>
                      {paymentLabel(result.payment_status)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 py-1.5">
                    <dt className="text-muted-foreground">Status tempahan</dt>
                    <dd className="font-medium text-foreground">{statusLabel(result.booking_status)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 py-1.5">
                    <dt className="text-muted-foreground">{result.type === "course" ? "Kursus" : "Bilik"}</dt>
                    <dd className="font-medium text-foreground text-right">{itemName}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 py-1.5">
                    <dt className="text-muted-foreground">Tarikh</dt>
                    <dd className="font-medium text-foreground text-right">{dateLabel || "—"}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 py-1.5">
                    <dt className="text-muted-foreground">Pax</dt>
                    <dd className="font-medium text-foreground">{result.num_pax}</dd>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <dt className="text-muted-foreground">Jumlah</dt>
                    <dd className="font-display text-lg font-bold text-primary">
                      RM {Number(result.total_amount).toFixed(2)}
                    </dd>
                  </div>
                </dl>

                {isPaid ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" variant="accent" onClick={downloadReceipt}>
                      Muat Turun Resit (PDF)
                    </Button>
                    {result.type === "course" && (
                      <Button size="sm" variant="outline" onClick={downloadCertificate}>
                        Muat Turun Sijil
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="mt-5 text-xs text-muted-foreground">
                    Resit dan sijil hanya tersedia selepas bayaran disahkan.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default CheckBooking;
