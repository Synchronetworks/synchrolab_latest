import { useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CourseCard } from "@/components/CourseCard";
import { categories } from "@/data/catalog";
import { useCourses } from "@/hooks/useCatalog";
import { cn } from "@/lib/utils";

const Courses = () => {
  const { data: courses = [], isLoading, error } = useCourses();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<typeof categories[number]>("Semua");

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchCat = cat === "Semua" || c.category === cat;
      const matchQ = !q || (c.title + c.short_desc).toLowerCase().includes(q.toLowerCase());
      return matchCat && matchQ;
    });
  }, [q, cat, courses]);

  return (
    <>
      <section className="bg-gradient-hero py-16">
        <div className="container">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent/90">Senarai Kursus</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold text-white md:text-5xl">
            Cari kursus IT yang sesuai untuk anda
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Daripada produktiviti pejabat sehingga cybersecurity dan AI — semua kursus disampaikan oleh trainer bertauliah industri.
          </p>
        </div>
      </section>

      <section className="container py-12 pt-0 -mt-[60px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari kursus..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium transition-base",
                  cat === c
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-card text-foreground/70 hover:border-accent hover:text-accent",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 py-10 text-center text-destructive">
            Gagal memuatkan kursus. Sila cuba semula.
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border py-20 text-center">
                <p className="text-muted-foreground">Tiada kursus dijumpai. Cuba kata kunci lain.</p>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
};

export default Courses;
