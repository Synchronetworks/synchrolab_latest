import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase places the recovery token in the URL hash and creates a session
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also check if a session already exists (e.g. after token exchanged)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password sekurang-kurangnya 6 aksara");
      return;
    }
    if (password !== confirm) {
      toast.error("Password tidak sepadan");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error("Gagal kemas kini password", { description: error.message });
      return;
    }
    toast.success("Password berjaya dikemas kini");
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
          ← Kembali ke log masuk
        </Link>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground">Tetap Semula Password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Masukkan password baru anda di bawah.
        </p>

        {!ready ? (
          <p className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Mengesahkan pautan tetap semula password... Jika tiada apa berlaku, sila klik semula pautan dari emel anda.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="new-password">Password Baru</Label>
              <div className="relative mt-1.5">
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  required
                  minLength={6}
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-new">Sahkan Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="confirm-new"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={6}
                  className={`pr-10 ${mismatch ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mismatch ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                  <X className="h-3 w-3" /> Password tidak sepadan
                </p>
              ) : confirm.length > 0 ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
                  <Check className="h-3 w-3" /> Password sepadan
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={submitting || mismatch}>
              <KeyRound className="h-4 w-4" />
              {submitting ? "Menyimpan..." : "Tetap Semula Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
