import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo-synchronetwork.png";

const links = [
  { to: "/", label: "Utama" },
  { to: "/kursus", label: "Kursus" },
  { to: "/sewa-bilik", label: "Sewa Bilik" },
  { to: "/semak-tempahan", label: "Semak Tempahan" },
  { to: "/hubungi", label: "Hubungi" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setAuthed(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Berjaya log keluar");
    navigate("/", { replace: true });
    setOpen(false);
  };

  const AuthButtons = ({ mobile = false }: { mobile?: boolean }) =>
    authed ? (
      <>
        <Button asChild variant={mobile ? "outline" : "ghost"} size="sm" className={mobile ? "w-full" : ""}>
          <Link to="/dashboard" onClick={() => setOpen(false)}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button variant={mobile ? "accent" : "accent"} size="sm" onClick={handleLogout} className={mobile ? "w-full" : ""}>
          <LogOut className="h-4 w-4" />
          Log Keluar
        </Button>
      </>
    ) : (
      <>
        <Button asChild variant="ghost" size="sm" className={mobile ? "w-full" : ""}>
          <Link to="/auth" onClick={() => setOpen(false)}>Log Masuk</Link>
        </Button>
        <Button asChild variant="accent" size="sm" className={mobile ? "w-full" : ""}>
          <Link to="/auth" onClick={() => setOpen(false)}>Daftar Sekarang</Link>
        </Button>
      </>
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/85 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img src={logo} alt="SynchroLab" className="h-9 w-9 object-contain" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold text-primary">SynchroLab</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">.my</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-base",
                  active ? "text-accent" : "text-foreground/70 hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <AuthButtons />
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/50 bg-background md:hidden">
          <nav className="container flex flex-col py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-foreground/80 hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <AuthButtons mobile />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
