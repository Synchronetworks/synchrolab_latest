import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";

const PaymentsAdmin = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Pembayaran (Billplz)</h1>
        <p className="text-sm text-muted-foreground">
          Tetapan gateway pembayaran Billplz untuk semua tempahan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            Status Konfigurasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <ConfigRow label="API Key" name="BILLPLZ_API_KEY" />
            <ConfigRow label="Collection ID" name="BILLPLZ_COLLECTION_ID" />
            <ConfigRow label="X-Signature Key" name="BILLPLZ_X_SIGNATURE_KEY" />
            <ConfigRow label="Mod" name="BILLPLZ_MODE" />
          </div>
          <p className="text-xs text-muted-foreground">
            Semua nilai disimpan secara selamat sebagai server secrets. Hanya server boleh akses — tidak dipaparkan di sini.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            URL Webhook (Callback)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Webhook ini disetkan secara automatik untuk setiap bil yang dibuat. Anda tidak perlu set apa-apa dalam dashboard Billplz — sistem hantar <code className="rounded bg-muted px-1.5 py-0.5 text-xs">callback_url</code> setiap kali bil dicipta.
          </p>
          <code className="block break-all rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs">
            https://mvdlhfkqzswfponiajsk.supabase.co/functions/v1/billplz-webhook
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Cara Tukar / Kemaskini Kredensial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Log masuk ke Billplz Dashboard.</li>
            <li>
              Untuk dapatkan API Key & X-Signature Key: <strong>Account Settings</strong>.
            </li>
            <li>
              Untuk dapatkan Collection ID: <strong>Billing → Collections</strong> (gunakan satu collection khas untuk Synchrolab).
            </li>
            <li>
              Untuk tukar kredensial, minta pembangun kemaskini secrets melalui Lovable Cloud (atau hubungi sokongan).
            </li>
            <li>
              Untuk tukar mod (sandbox ↔ production), kemaskini secret <code className="rounded bg-muted px-1.5 py-0.5 text-xs">BILLPLZ_MODE</code>.
            </li>
          </ol>
          <Button asChild variant="outline" size="sm">
            <a href="https://www.billplz.com/enterprise/api" target="_blank" rel="noreferrer">
              Dokumentasi API Billplz <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const ConfigRow = ({ label, name }: { label: string; name: string }) => (
  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="font-mono text-xs text-muted-foreground">{name}</p>
    </div>
    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
      Aktif
    </Badge>
  </div>
);

export default PaymentsAdmin;
