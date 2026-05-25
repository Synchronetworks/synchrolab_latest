import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, DoorOpen, LogOut, Calendar, Hash } from "lucide-react";
import { toast } from "sonner";

type Booking = {
  id: string;
  ref_no: string;
  type: "course" | "room";
  customer_name: string;
  num_pax: number;
  total_amount: number;
  payment_status: string;
  booking_status: string;
  booking_date_from: string | null;
  booking_date_to: string | null;
  course_id: string | null;
  slot_id: string | null;
  room_id: string | null;
  created_at: string;
  course_title?: string;
  slot_label?: string;
  room_name?: string;
};

const statusColor = (s: string) => {
  switch (s) {
    case "paid":
    case "confirmed":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
    case "pending":
    case "unpaid":
      return "bg-amber-500/15 text-amber-700 border-amber-500/30";
    case "cancelled":
    case "refunded":
    case "failed":
      return "bg-rose-500/15 text-rose-700 border-rose-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" });

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setEmail(session.user.email ?? "");

      const [{ data: profile }, { data: bks }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle(),
        supabase
          .from("bookings")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profile?.full_name) setFullName(profile.full_name);

      const rows = (bks ?? []) as Booking[];
      const courseIds = [...new Set(rows.filter((b) => b.course_id).map((b) => b.course_id!))];
      const slotIds = [...new Set(rows.filter((b) => b.slot_id).map((b) => b.slot_id!))];
      const roomIds = [...new Set(rows.filter((b) => b.room_id).map((b) => b.room_id!))];

      const [coursesRes, slotsRes, roomsRes] = await Promise.all([
        courseIds.length
          ? supabase.from("courses").select("id,title").in("id", courseIds)
          : Promise.resolve({ data: [] as any[] }),
        slotIds.length
          ? supabase.from("course_slots").select("id,date_label,time_label").in("id", slotIds)
          : Promise.resolve({ data: [] as any[] }),
        roomIds.length
          ? supabase.from("rooms").select("id,name").in("id", roomIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const courseMap = new Map((coursesRes.data ?? []).map((c: any) => [c.id, c.title]));
      const slotMap = new Map(
        (slotsRes.data ?? []).map((s: any) => [s.id, `${s.date_label} • ${s.time_label}`]),
      );
      const roomMap = new Map((roomsRes.data ?? []).map((r: any) => [r.id, r.name]));

      setBookings(
        rows.map((b) => ({
          ...b,
          course_title: b.course_id ? courseMap.get(b.course_id) : undefined,
          slot_label: b.slot_id ? slotMap.get(b.slot_id) : undefined,
          room_name: b.room_id ? roomMap.get(b.room_id) : undefined,
        })),
      );
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Berjaya log keluar");
    navigate("/", { replace: true });
  };

  const courseBookings = bookings.filter((b) => b.type === "course");
  const roomBookings = bookings.filter((b) => b.type === "room");

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Hai, {fullName || email.split("@")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Log Keluar
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Jumlah Tempahan" value={bookings.length} />
        <StatCard label="Tempahan Kursus" value={courseBookings.length} />
        <StatCard label="Tempahan Bilik" value={roomBookings.length} />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Tempahan Kursus Saya</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/kursus">Lihat semua kursus →</Link>
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? (
            <Skeleton className="h-28 w-full" />
          ) : courseBookings.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="Belum ada tempahan kursus"
              cta={<Button asChild><Link to="/kursus">Layari kursus</Link></Button>}
            />
          ) : (
            courseBookings.map((b) => (
              <BookingRow key={b.id} b={b} title={b.course_title ?? "Kursus"} subtitle={b.slot_label} />
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Tempahan Bilik Saya</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/sewa-bilik">Lihat bilik →</Link>
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? (
            <Skeleton className="h-28 w-full" />
          ) : roomBookings.length === 0 ? (
            <EmptyState
              icon={<DoorOpen className="h-6 w-6" />}
              title="Belum ada tempahan bilik"
              cta={<Button asChild><Link to="/sewa-bilik">Tempah bilik</Link></Button>}
            />
          ) : (
            roomBookings.map((b) => {
              const range =
                b.booking_date_from && b.booking_date_to
                  ? `${fmtDate(b.booking_date_from)} – ${fmtDate(b.booking_date_to)}`
                  : undefined;
              return <BookingRow key={b.id} b={b} title={b.room_name ?? "Bilik"} subtitle={range} />;
            })
          )}
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="font-display text-3xl font-extrabold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

const EmptyState = ({
  icon,
  title,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  cta: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
    <div className="grid h-12 w-12 place-items-center rounded-full bg-background text-muted-foreground">
      {icon}
    </div>
    <p className="mt-3 text-sm text-muted-foreground">{title}</p>
    <div className="mt-4">{cta}</div>
  </div>
);

const BookingRow = ({
  b,
  title,
  subtitle,
}: {
  b: Booking;
  title: string;
  subtitle?: string;
}) => (
  <Card className="transition-base hover:shadow-elegant">
    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
          <Badge variant="outline" className={statusColor(b.booking_status)}>
            {b.booking_status}
          </Badge>
          <Badge variant="outline" className={statusColor(b.payment_status)}>
            {b.payment_status}
          </Badge>
        </div>
        {subtitle && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> {subtitle}
          </p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Hash className="h-3 w-3" /> {b.ref_no} • {b.num_pax} peserta
        </p>
      </div>
      <div className="text-right">
        <p className="font-display text-lg font-bold text-foreground">{fmtMoney(b.total_amount)}</p>
        <p className="text-xs text-muted-foreground">{fmtDate(b.created_at)}</p>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;
