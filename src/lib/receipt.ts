import jsPDF from "jspdf";
import logoUrl from "@/assets/logo-synchronetwork.png";

export type ReceiptData = {
  ref_no: string;
  type: "course" | "room";
  customer_name: string;
  email: string;
  num_pax: number;
  total_amount: number;
  subtotal_amount?: number | null;
  discount_amount?: number | null;
  promo_code?: string | null;
  payment_status: string;
  itemTitle: string;
  dateLabel?: string;
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(n);

const loadLogo = async (): Promise<string | null> => {
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const TERMS = [
  "1. Resit ini adalah pengesahan rasmi pembayaran untuk tempahan di atas dan dijana secara automatik oleh sistem.",
  "2. Bayaran yang telah dibuat adalah TIDAK BOLEH DIKEMBALIKAN (non-refundable), kecuali bagi kes pembatalan oleh pihak penganjur.",
  "3. Penjadualan semula (reschedule) hanya dibenarkan sekurang-kurangnya 7 hari sebelum tarikh kursus / sewaan, tertakluk kepada ketersediaan slot.",
  "4. Peserta / penyewa bertanggungjawab memastikan ketepatan maklumat tempahan. Sebarang pertukaran nama mesti dimaklumkan terlebih dahulu.",
  "5. Sijil penyertaan kursus hanya dikeluarkan setelah peserta menghadiri sekurang-kurangnya 80% sesi.",
  "6. Pihak SynchroLab.my berhak menukar jadual, fasilitator atau lokasi tanpa notis awal dalam keadaan tidak dijangka.",
  "7. Sila simpan resit ini sebagai rekod. Untuk pertanyaan, e-mel hello@synchrolab.my atau hubungi talian rasmi.",
];

export const downloadBookingReceipt = async (data: ReceiptData) => {
  const doc = new jsPDF();
  const logo = await loadLogo();
  const today = new Date().toLocaleDateString("ms-MY");

  // Header band
  doc.setFillColor(30, 58, 95); // navy
  doc.rect(0, 0, 210, 38, "F");

  if (logo) {
    try {
      doc.addImage(logo, "PNG", 15, 8, 22, 22);
    } catch {
      /* ignore */
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("RESIT RASMI", 200, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("SynchroLab.my", 200, 26, { align: "right" });
  doc.setFontSize(8);
  doc.text("Synchronetwork Sdn. Bhd. (1194790-K)", 200, 32, { align: "right" });

  // Body
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("79A, Jalan Nova U5/N, Subang Bestari Sek. U5, 40150 Shah Alam, Selangor", 15, 46);
  doc.text("hello@synchrolab.my  •  www.synchrolab.my", 15, 51);

  doc.setDrawColor(220);
  doc.line(15, 56, 195, 56);

  // Customer & ref info
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Maklumat Resit", 15, 64);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`No. Rujukan:`, 15, 71);
  doc.text(data.ref_no, 55, 71);
  doc.text(`Tarikh Resit:`, 15, 77);
  doc.text(today, 55, 77);
  doc.text(`Status Bayaran:`, 15, 83);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    data.payment_status === "paid" ? 16 : 200,
    data.payment_status === "paid" ? 140 : 120,
    data.payment_status === "paid" ? 70 : 30
  );
  doc.text(data.payment_status === "paid" ? "DIBAYAR" : data.payment_status.toUpperCase(), 55, 83);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");

  doc.setFont("helvetica", "bold");
  doc.text("Pelanggan", 115, 64);
  doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize(data.customer_name, 80), 115, 71);
  doc.text(doc.splitTextToSize(data.email, 80), 115, 77);

  doc.line(15, 92, 195, 92);

  // Booking details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Butiran Tempahan", 15, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let y = 108;
  doc.text(data.type === "course" ? "Kursus:" : "Bilik:", 15, y);
  doc.text(doc.splitTextToSize(data.itemTitle, 135), 55, y);
  y += data.itemTitle.length > 60 ? 12 : 7;

  if (data.dateLabel) {
    doc.text("Tarikh:", 15, y);
    doc.text(doc.splitTextToSize(data.dateLabel, 135), 55, y);
    y += 7;
  }
  doc.text("Bil. Peserta:", 15, y);
  doc.text(String(data.num_pax), 55, y);
  y += 10;

  doc.line(15, y, 195, y);
  y += 8;

  // Pricing breakdown
  const subtotal = Number(data.subtotal_amount ?? data.total_amount) || 0;
  const discount = Number(data.discount_amount ?? 0) || 0;
  const total = Number(data.total_amount) || 0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Pecahan Bayaran", 15, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text("Harga Asal (Subtotal):", 15, y);
  doc.text(fmtMoney(subtotal), 195, y, { align: "right" });
  y += 7;

  if (discount > 0) {
    doc.setTextColor(180, 60, 60);
    const promoLabel = data.promo_code ? `Diskaun (${data.promo_code}):` : "Diskaun:";
    doc.text(promoLabel, 15, y);
    doc.text(`- ${fmtMoney(discount)}`, 195, y, { align: "right" });
    doc.setTextColor(20, 20, 20);
    y += 7;
  }

  doc.text("Cukai / SST:", 15, y);
  doc.text("RM 0.00", 195, y, { align: "right" });
  y += 4;

  doc.setDrawColor(180);
  doc.line(15, y, 195, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setFillColor(240, 245, 252);
  doc.rect(15, y - 5, 180, 12, "F");
  doc.text("Jumlah Dibayar:", 18, y + 3);
  doc.setTextColor(30, 58, 95);
  doc.text(fmtMoney(total), 192, y + 3, { align: "right" });
  doc.setTextColor(20, 20, 20);
  y += 15;

  // Terms & Conditions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Terma & Syarat", 15, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  TERMS.forEach((t) => {
    const lines = doc.splitTextToSize(t, 180);
    doc.text(lines, 15, y);
    y += lines.length * 3.6 + 1;
  });

  // Footer
  doc.setTextColor(120);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Terima kasih kerana menggunakan SynchroLab.my", 105, 285, { align: "center" });
  doc.setFontSize(7);
  doc.text("Resit ini dijana secara automatik dan sah tanpa tandatangan.", 105, 290, { align: "center" });

  doc.save(`Resit-${data.ref_no}.pdf`);
};
