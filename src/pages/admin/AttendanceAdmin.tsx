import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, CheckCircle2, Loader2, QrCode, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CheckInResult = {
  ref_no: string;
  customer_name: string;
  email: string;
  num_pax: number;
  course_title: string | null;
  slot_label: string | null;
  payment_status: string;
  booking_status: string;
  checked_in_at: string | null;
  already_checked_in: boolean;
};

const READER_ID = "attendance-qr-reader";

const AttendanceAdmin = () => {
  const [scanning, setScanning] = useState(false);
  const [manualRef, setManualRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckInResult[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const lastRefRef = useRef<string>("");

  const stopScanner = async () => {
    const s = scannerRef.current;
    if (!s) return;
    try {
      const state = s.getState();
      // 2 = SCANNING, 3 = PAUSED (from Html5QrcodeScannerState)
      if (state === 2 || state === 3) {
        await s.stop();
      }
      await s.clear();
    } catch {
      /* ignore */
    }
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  const handleCheckIn = async (refNoRaw: string) => {
    const refNo = refNoRaw.trim().toUpperCase();
    if (!refNo) return;
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.rpc("admin_check_in_booking", {
        _ref: refNo,
      });
      if (err) throw err;
      const row = (Array.isArray(data) ? data[0] : data) as CheckInResult | undefined;
      if (!row) {
        throw new Error("Tempahan tidak dijumpai");
      }
      setResult(row);
      setHistory((h) => [row, ...h.filter((x) => x.ref_no !== row.ref_no)].slice(0, 20));
      if (row.already_checked_in) {
        toast.info(`${row.customer_name} sudah daftar masuk sebelum ini`);
      } else {
        toast.success(`Kehadiran disahkan: ${row.customer_name}`);
      }
    } catch (e: any) {
      const msg = e?.message ?? "Ralat mengesahkan kehadiran";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setTimeout(() => {
        busyRef.current = false;
      }, 1500);
    }
  };

  const startScanner = async () => {
    setError(null);
    if (scannerRef.current) await stopScanner();
    setScanning(true);
    // wait next tick for div to render
    setTimeout(async () => {
      try {
        const html5 = new Html5Qrcode(READER_ID, { verbose: false });
        scannerRef.current = html5;
        const vw = Math.min(window.innerWidth, 640);
        const boxSize = Math.max(220, Math.floor(vw * 0.78));
        await html5.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: boxSize, height: boxSize },
            aspectRatio: window.innerWidth < 640 ? 1 : 1.3333,
          },
          (decoded) => {
            const ref = decoded.trim().toUpperCase();
            if (!ref || ref === lastRefRef.current) return;
            lastRefRef.current = ref;
            void handleCheckIn(ref);
            setTimeout(() => {
              lastRefRef.current = "";
            }, 3000);
          },
          () => {
            /* ignore decode errors per frame */
          },
        );
      } catch (e: any) {
        setError(e?.message ?? "Tidak dapat akses kamera");
        setScanning(false);
      }
    }, 100);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleCheckIn(manualRef);
    setManualRef("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Kehadiran Peserta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Imbas kod QR peserta untuk sahkan kehadiran. Tarikh dan masa akan dirakam secara automatik.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-accent" /> Imbas QR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              id={READER_ID}
              className="overflow-hidden rounded-xl border border-border bg-muted/30 [&_video]:!w-full [&_video]:!h-auto"
              style={{ minHeight: scanning ? (typeof window !== "undefined" && window.innerWidth < 640 ? 380 : 320) : 0 }}
            />
            {!scanning ? (
              <Button onClick={startScanner} className="w-full">
                <Camera className="h-4 w-4" /> Mulakan Kamera
              </Button>
            ) : (
              <Button onClick={stopScanner} variant="outline" className="w-full">
                <CameraOff className="h-4 w-4" /> Hentikan Kamera
              </Button>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-2 border-t border-border pt-4">
              <Label htmlFor="manual-ref">Atau masukkan nombor rujukan secara manual</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-ref"
                  placeholder="SYL-2025-000001"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                />
                <Button type="submit" disabled={loading || !manualRef.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sahkan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Keputusan</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm text-foreground">{error}</p>
              </div>
            )}
            {!error && !result && (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Belum ada imbasan. Mulakan kamera atau masukkan nombor rujukan.
              </p>
            )}
            {result && (
              <div
                className={`rounded-xl border p-5 ${
                  result.already_checked_in
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-emerald-500/30 bg-emerald-500/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className={`mt-0.5 h-6 w-6 shrink-0 ${
                      result.already_checked_in ? "text-amber-600" : "text-emerald-600"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-display text-lg font-bold text-foreground">
                      {result.customer_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{result.email}</p>
                    <p className="mt-2 font-mono text-sm font-semibold text-foreground">
                      {result.ref_no}
                    </p>
                    {result.course_title && (
                      <p className="mt-2 text-sm text-foreground">{result.course_title}</p>
                    )}
                    {result.slot_label && (
                      <p className="text-xs text-muted-foreground">{result.slot_label}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">{result.num_pax} peserta</Badge>
                      {result.already_checked_in ? (
                        <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">
                          Sudah hadir
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                          Baru disahkan
                        </Badge>
                      )}
                    </div>
                    {result.checked_in_at && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Daftar masuk:{" "}
                        <span className="font-medium text-foreground">
                          {new Date(result.checked_in_at).toLocaleString("ms-MY")}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sesi Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {history.map((h) => (
                <div
                  key={h.ref_no + (h.checked_in_at ?? "")}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{h.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.ref_no} • {h.course_title ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {h.checked_in_at
                        ? new Date(h.checked_in_at).toLocaleString("ms-MY")
                        : "—"}
                    </p>
                    {h.already_checked_in && (
                      <Badge variant="outline" className="mt-1 border-amber-500/30 text-amber-700">
                        Berulang
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceAdmin;
