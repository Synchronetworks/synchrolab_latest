import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, Eye, EyeOff } from "lucide-react";

const Hint = ({ ok, text }: { ok: boolean; text: string }) => (
  <li className={`flex items-center gap-1 ${ok ? "text-emerald-600" : ""}`}>
    {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-50" />}
    {text}
  </li>
);

const schema = z.object({
  email: z.string().trim().email("Emel tidak sah").max(255),
  password: z.string().min(6, "Password sekurang-kurangnya 6 aksara").max(72),
});

type StrengthLevel = 0 | 1 | 2 | 3 | 4;
const strengthMeta: Record<StrengthLevel, { label: string; color: string; text: string }> = {
  0: { label: "Terlalu lemah", color: "bg-rose-500", text: "text-rose-600" },
  1: { label: "Lemah", color: "bg-rose-500", text: "text-rose-600" },
  2: { label: "Sederhana", color: "bg-amber-500", text: "text-amber-600" },
  3: { label: "Kuat", color: "bg-emerald-500", text: "text-emerald-600" },
  4: { label: "Sangat Kuat", color: "bg-emerald-600", text: "text-emerald-700" },
};

const evaluatePassword = (pw: string) => {
  const checks = {
    length8: pw.length >= 8,
    length12: pw.length >= 12,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  let score = 0;
  if (checks.length8) score++;
  if (checks.length12) score++;
  if (checks.lower && checks.upper) score++;
  if (checks.number) score++;
  if (checks.symbol) score++;
  if (pw.length < 6) score = 0;
  const level = Math.min(4, score) as StrengthLevel;
  return { level, checks };
};

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { level, checks } = evaluatePassword(password);
  const confirmMismatch = mode === "signup" && confirmPassword.length > 0 && confirmPassword !== password;

  const redirectAfterAuth = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    navigate(data ? "/admin" : "/dashboard", { replace: true });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) redirectAfterAuth(session.user.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (mode === "signup" && parsed.data.password !== confirmPassword) {
      toast.error("Confirm password tidak sepadan");
      return;
    }

    setSubmitting(true);
    const { email, password } = parsed.data;
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Berjaya log masuk");
        if (data.user) await redirectAfterAuth(data.user.id);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Akaun dicipta", { description: "Sila log masuk." });
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Ralat tidak diketahui");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Kembali ke laman utama
        </Link>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground">
          {mode === "login" ? "Log Masuk" : "Daftar Akaun"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Akses dashboard tempahan anda."
            : "Cipta akaun untuk uruskan tempahan anda."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Emel</Label>
            <Input id="email" name="email" type="email" required className="mt-1.5" autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="pr-10"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyi password" : "Tunjuk password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === "signup" && password.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < level ? strengthMeta[level].color : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${strengthMeta[level].text}`}>
                    {strengthMeta[level].label}
                  </span>
                  <span className="text-muted-foreground">{password.length} aksara</span>
                </div>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <Hint ok={checks.length8} text="8+ aksara" />
                  <Hint ok={checks.upper && checks.lower} text="Huruf besar & kecil" />
                  <Hint ok={checks.number} text="Nombor" />
                  <Hint ok={checks.symbol} text="Simbol (!@#...)" />
                </ul>
              </div>
            )}
          </div>
          {mode === "signup" && (
            <div>
              <Label htmlFor="confirm-password">Sahkan Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={6}
                  className={`pr-10 ${confirmMismatch ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Sembunyi password" : "Tunjuk password"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmMismatch ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                  <X className="h-3 w-3" /> Password tidak sepadan
                </p>
              ) : confirmPassword.length > 0 ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
                  <Check className="h-3 w-3" /> Password sepadan
                </p>
              ) : null}
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting || confirmMismatch}
          >
            <LogIn className="h-4 w-4" />
            {submitting ? "Memproses..." : mode === "login" ? "Log Masuk" : "Daftar"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? "Belum ada akaun? Daftar" : "Sudah ada akaun? Log masuk"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
