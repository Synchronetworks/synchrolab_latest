import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, DoorOpen, Calendar, Hash, User, Save, KeyRound, Camera, Link2, FileText } from "lucide-react";
import { toast } from "sonner";
import { downloadBookingReceipt } from "@/lib/receipt";

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
  email: string;
  payment_url: string | null;
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
  const [userId, setUserId] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [linkingBookings, setLinkingBookings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setEmail(session.user.email ?? "");
      setUserId(session.user.id);

      const [{ data: profile }, { data: bks }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, avatar_url, age, company").eq("id", session.user.id).maybeSingle(),
        supabase
          .from("bookings")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profile?.full_name) setFullName(profile.full_name);
      setProfileName(profile?.full_name ?? "");
      setPhone(profile?.phone ?? "");
      setAvatarUrl((profile as any)?.avatar_url ?? "");
      setAge((profile as any)?.age != null ? String((profile as any).age) : "");
      setCompany((profile as any)?.company ?? "");

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    let ageNum: number | null = null;
    if (age.trim()) {
      const n = parseInt(age.trim(), 10);
      if (isNaN(n) || n < 1 || n > 120) {
        toast.error("Umur tidak sah (1-120)");
        return;
      }
      ageNum = n;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: profileName.trim() || null,
        phone: phone.trim() || null,
        age: ageNum,
        company: company.trim() || null,
      });
    setSavingProfile(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setFullName(profileName.trim());
    toast.success("Profil dikemaskini");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Sila pilih fail imej");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Saiz imej maksimum 2MB");
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", upsert: true });
    if (upErr) {
      setUploadingAvatar(false);
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, avatar_url: url });
    setUploadingAvatar(false);
    if (updErr) {
      toast.error(updErr.message);
      return;
    }
    setAvatarUrl(url);
    toast.success("Gambar profil dikemaskini");
  };

  const handleResetPassword = async () => {
    if (!email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pautan reset kata laluan dihantar ke emel anda");
  };

  const handleLinkBookings = async () => {
    setLinkingBookings(true);
    const { data, error } = await supabase.rpc("link_bookings_to_user");
    setLinkingBookings(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const n = (data as number) ?? 0;
    if (n > 0) {
      toast.success(`${n} tempahan dihubungkan ke akaun anda`);
      window.location.reload();
    } else {
      toast.info("Tiada tempahan baru untuk dihubungkan");
    }
  };

  const courseBookings = bookings.filter((b) => b.type === "course");
  const roomBookings = bookings.filter((b) => b.type === "room");

  const initials = (fullName || email)
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="container py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          Hai, {fullName || email.split("@")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{email}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Jumlah Tempahan" value={bookings.length} />
        <StatCard label="Tempahan Kursus" value={courseBookings.length} />
        <StatCard label="Tempahan Bilik" value={roomBookings.length} />
      </div>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <User className="h-5 w-5 text-accent" />
            Profil Saya
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Maklumat ini akan dipaparkan secara automatik pada borang tempahan.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src={avatarUrl} alt={fullName || email} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <Camera className="h-4 w-4" />
                {uploadingAvatar ? "Memuat naik..." : "Tukar Gambar"}
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">JPG/PNG, maks. 2MB</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="profile-email">Emel</Label>
              <Input id="profile-email" value={email} disabled className="mt-1.5 bg-muted" />
            </div>
            <div>
              <Label htmlFor="profile-name">Nama Penuh</Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                maxLength={200}
                className="mt-1.5"
                placeholder="Nama anda"
              />
            </div>
            <div>
              <Label htmlFor="profile-phone">No. Telefon</Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
                className="mt-1.5"
                placeholder="012-3456789"
              />
            </div>
            <div>
              <Label htmlFor="profile-age">Umur</Label>
              <Input
                id="profile-age"
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1.5"
                placeholder="cth: 28"
              />
            </div>
            <div>
              <Label htmlFor="profile-company">
                Syarikat <span className="text-muted-foreground">(pilihan)</span>
              </Label>
              <Input
                id="profile-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                maxLength={200}
                className="mt-1.5"
                placeholder="Nama syarikat"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                <Save className="h-4 w-4" />
                {savingProfile ? "Menyimpan..." : "Simpan Profil"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <KeyRound className="h-5 w-5 text-accent" />
            Keselamatan & Tempahan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground">Tukar Kata Laluan</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Kami akan hantar pautan reset ke emel anda.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleResetPassword}
              disabled={sendingReset}
            >
              <KeyRound className="h-4 w-4" />
              {sendingReset ? "Menghantar..." : "Hantar Pautan Reset"}
            </Button>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground">Hubungkan Tempahan Lama</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Pautkan tempahan yang dibuat sebelum log masuk (mengikut emel) ke akaun ini.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleLinkBookings}
              disabled={linkingBookings}
            >
              <Link2 className="h-4 w-4" />
              {linkingBookings ? "Memproses..." : "Hubungkan Sekarang"}
            </Button>
          </div>
        </CardContent>
      </Card>


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

const downloadReceipt = (b: Booking, title: string, subtitle?: string) => {
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
  doc.text(`No. Rujukan: ${b.ref_no}`, 20, 60);
  doc.text(`Tarikh Resit: ${today}`, 20, 67);
  doc.text(`Pelanggan: ${b.customer_name}`, 20, 74);
  doc.text(`E-mel: ${b.email}`, 20, 81);
  doc.text(`Status Bayaran: PAID`, 20, 88);

  doc.setFont("helvetica", "bold");
  doc.text("Butiran Tempahan", 20, 102);
  doc.setFont("helvetica", "normal");

  doc.text(`${b.type === "course" ? "Kursus" : "Bilik"}:`, 20, 112);
  doc.text(doc.splitTextToSize(title, 125), 60, 112);
  if (subtitle) {
    doc.text(`Tarikh:`, 20, 122);
    doc.text(doc.splitTextToSize(subtitle, 125), 60, 122);
  }
  doc.text(`Bil. Peserta:`, 20, 132);
  doc.text(String(b.num_pax), 60, 132);

  doc.line(20, 145, 190, 145);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Jumlah Dibayar:", 20, 155);
  doc.text(fmtMoney(b.total_amount), 190, 155, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Terima kasih kerana menggunakan SynchroLab.my", 105, 280, { align: "center" });

  doc.save(`Resit-${b.ref_no}.pdf`);
};

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
      <div className="flex flex-col items-end gap-2">
        <p className="font-display text-lg font-bold text-foreground">{fmtMoney(b.total_amount)}</p>
        <p className="text-xs text-muted-foreground">{fmtDate(b.created_at)}</p>
        {b.payment_status === "paid" ? (
          <Button size="sm" variant="outline" onClick={() => downloadReceipt(b, title, subtitle)}>
            <FileText className="h-4 w-4" /> Lihat Resit
          </Button>
        ) : (
          <PayButton refNo={b.ref_no} email={b.email} payUrl={b.payment_url} />
        )}
      </div>
    </CardContent>
  </Card>
);

const PayButton = ({ refNo, email, payUrl }: { refNo: string; email: string; payUrl: string | null }) => {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    if (payUrl) {
      window.location.href = payUrl;
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("create-billplz-bill", {
      body: { ref_no: refNo, email },
    });
    setLoading(false);
    if (error || !data?.url) {
      toast.error("Gagal buka laman bayaran", { description: error?.message ?? data?.error });
      return;
    }
    window.location.href = data.url;
  };
  return (
    <Button size="sm" onClick={handleClick} disabled={loading}>
      {loading ? "Membuka..." : "Bayar Sekarang"}
    </Button>
  );
};

export default Dashboard;
