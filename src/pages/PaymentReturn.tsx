import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2, Hash } from "lucide-react";

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(n);

const PaymentReturn = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "paid" | "unpaid" | "error">("loading");
  const [booking, setBooking] = useState<any>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fields: Record<string, string> = {};
    // Billplz prepends "billplz[" prefix on redirect; extract them.
    for (const [k, v] of params.entries()) {
      const m = k.match(/^billplz\[(.+)\]$/);
      if (m) fields[m[1]] = v;
    }

    if (!fields.id || !fields.x_signature) {
      setStatus("error");
      setMessage("Parameter Billplz tidak sah.");
      return;
    }

    (async () => {
      const { data, error } = await supabase.functions.invoke("billplz-verify-redirect", {
        body: { fields },
      });
      if (error || !data?.valid) {
        setStatus("error");
        setMessage(data?.error ?? error?.message ?? "Gagal mengesahkan bayaran");
        return;
      }
      setBooking(data.booking);
      setStatus(data.paid ? "paid" : "unpaid");
    })();
  }, [params]);

  return (
    <div className="container max-w-xl py-16">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-2xl font-extrabold">
            {status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-accent" />}
            {status === "paid" && <CheckCircle2 className="h-6 w-6 text-emerald-600" />}
            {(status === "unpaid" || status === "error") && (
              <AlertCircle className="h-6 w-6 text-amber-600" />
            )}
            {status === "loading" && "Mengesahkan bayaran..."}
            {status === "paid" && "Bayaran Berjaya"}
            {status === "unpaid" && "Bayaran Belum Selesai"}
            {status === "error" && "Ralat"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "error" && <p className="text-sm text-muted-foreground">{message}</p>}
          {booking && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="h-3.5 w-3.5" /> {booking.ref_no}
              </p>
              <p className="mt-2 font-medium text-foreground">{booking.customer_name}</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">
                {fmtMoney(Number(booking.total_amount))}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                Status: {booking.payment_status} • {booking.booking_status}
              </p>
            </div>
          )}
          {status === "paid" && (
            <p className="text-sm text-muted-foreground">
              Terima kasih! Resit dan butiran tempahan dihantar ke emel anda.
            </p>
          )}
          {status === "unpaid" && (
            <p className="text-sm text-muted-foreground">
              Anda boleh teruskan bayaran semula dari halaman Dashboard.
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button asChild className="flex-1">
              <Link to="/dashboard">Ke Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">Laman Utama</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReturn;
