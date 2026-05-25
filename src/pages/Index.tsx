import { Link } from "react-router-dom";
import { ArrowRight, Award, CalendarCheck, CheckCircle2, GraduationCap, Loader2, Quote, Shield, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { supabase } from "@/integrations/supabase/client";
import { useCourses, useFeaturedCourses } from "@/hooks/useCatalog";
import heroImg from "@/assets/hero-classroom.jpg";
import hrdcorpBadge from "@/assets/hrdcorp-badge.png";

const features = [
  { icon: Award, title: "Pengajar Bertauliah", desc: "Trainer industri dengan pensijilan antarabangsa Microsoft, Cisco, AWS dan lebih lagi." },
  { icon: CalendarCheck, title: "Jadual Fleksibel", desc: "Pelbagai slot tarikh setiap bulan, atau kursus tertutup mengikut keperluan organisasi anda." },
  { icon: Shield, title: "HRD Corp Claimable", desc: "Sebahagian besar kursus boleh dituntut menerusi geran HRD Corp untuk syarikat yang layak." },
  { icon: GraduationCap, title: "Sijil Diiktiraf", desc: "Setiap peserta menerima sijil digital rasmi dan boleh dimuat turun terus dari sistem." },
];

const Index = () => {
  const { data: courses = [], isLoading } = useCourses();
  const { data: featuredFromAdmin = [] } = useFeaturedCourses();
  const featured = (featuredFromAdmin.length > 0 ? featuredFromAdmin : courses).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover" width={1600} height={1024} />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-primary/20" />
        </div>

        <div className="container relative py-20 md:py-28 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Platform Latihan IT #1 di Malaysia
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
              Tingkatkan kemahiran. <br />
              <span className="bg-gradient-to-r from-accent to-cyan-300 bg-clip-text text-transparent">
                Sewa ruang latihan.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              SynchroLab.my menawarkan kursus IT bertauliah dan kemudahan bilik latihan moden untuk individu, pasukan dan organisasi di seluruh Malaysia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/kursus">Lihat Senarai Kursus <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="heroOutline" size="xl">
                <Link to="/sewa-bilik">Sewa Bilik Latihan</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/80">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> 50+ Kursus IT</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> 2,000+ Peserta</div>
              <div className="flex items-center gap-2.5 rounded-full bg-white/95 px-3 py-1.5 shadow-md ring-1 ring-white/40">
                <img src={hrdcorpBadge} alt="HRD Corp Registered Training Provider" className="h-7 w-7 object-contain" />
                <span className="text-xs font-semibold text-primary">HRD Corp Registered Training Provider</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">Kursus Pilihan</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
                Kursus popular bulan ini
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/kursus">Semua Kursus <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          )}
        </div>
      </section>

      {/* Why SynchroLab */}
      <section className="bg-gradient-soft py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">Kenapa SynchroLab</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
              Pilihan profesional Malaysia <br />
              untuk latihan IT
            </h2>
            <p className="mt-4 text-muted-foreground">
              Kami komited menyampaikan pengalaman latihan berkualiti tinggi yang relevan dengan pasaran tempatan.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-smooth hover:shadow-elegant">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-accent shadow-glow">
                  <f.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">Testimoni</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
              Apa kata peserta kami
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="relative rounded-2xl border border-border bg-card p-7 shadow-soft">
                <Quote className="absolute right-6 top-6 h-8 w-8 text-accent/15" />
                <p className="text-sm leading-relaxed text-foreground/80">"{t.text}"</p>
                <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                  <img
                    src={t.image}
                    alt={t.name}
                    loading="lazy"
                    width={80}
                    height={80}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-accent/20"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 shadow-elegant md:p-16">
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
                Sedia tingkatkan pasukan anda?
              </h2>
              <p className="mt-3 max-w-xl text-white/80">
                Hubungi kami untuk pakej korporat, latihan tertutup (in-house), atau sewa kemudahan bilik latihan untuk acara anda.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/kursus">Daftar Kursus</Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <Link to="/hubungi">Hubungi Kami</Link>
              </Button>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        </div>
      </section>
    </>
  );
};

export default Index;
