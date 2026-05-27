import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  refNo: string;
  customerName?: string;
  title?: string;
  subtitle?: string;
  checkedInAt?: string | null;
  size?: "sm" | "default";
};

export const BookingQRCode = ({
  refNo,
  customerName,
  title,
  subtitle,
  checkedInAt,
  size = "sm",
}: Props) => {
  const value = refNo.toUpperCase();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size={size} variant="outline">
          <QrCode className="h-4 w-4" /> Tunjuk QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">QR Kehadiran</DialogTitle>
          <DialogDescription>
            Tunjuk kod QR ini kepada admin semasa pendaftaran kehadiran.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="rounded-xl border border-border bg-white p-4">
            <QRCodeSVG value={value} size={220} level="M" includeMargin={false} />
          </div>
          <div className="text-center">
            <p className="font-mono text-sm font-semibold text-foreground">{value}</p>
            {customerName && (
              <p className="mt-1 text-sm text-muted-foreground">{customerName}</p>
            )}
            {title && <p className="text-xs text-muted-foreground">{title}</p>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {checkedInAt ? (
            <p className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700">
              ✓ Sudah hadir pada {new Date(checkedInAt).toLocaleString("ms-MY")}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Belum daftar masuk</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
