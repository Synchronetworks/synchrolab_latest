import { Link } from "react-router-dom";
import { Clock, Users, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CourseRow } from "@/hooks/useCatalog";
import { isEarlyBirdActive } from "@/lib/coursePricing";

export const CourseCard = ({ course }: { course: CourseRow }) => {
  const statusStyle = {
    "Ada Tempat": "bg-success/10 text-success border-success/20",
    "Hampir Penuh": "bg-warning/10 text-warning border-warning/20",
    "Penuh": "bg-destructive/10 text-destructive border-destructive/20",
  }[course.status];

  return (
    <Link
      to={`/kursus/${course.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-smooth hover:-translate-y-1 hover:border-accent/40 hover:shadow-elegant"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={course.image}
          alt={course.title}
          loading="lazy"
          width={800}
          height={500}
          className="h-full w-full object-cover transition-smooth group-hover:scale-105"
        />
        <span className={cn("absolute right-3 top-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm", statusStyle)}>
          {course.status}
        </span>
        {isEarlyBirdActive(course) && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-100/90 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" /> Early Bird
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline" className="border-accent/30 bg-accent-soft text-accent">
            {course.category}
          </Badge>
        </div>

        <h3 className="mt-4 font-display text-lg font-bold leading-snug text-foreground group-hover:text-accent">
          {course.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{course.short_desc}</p>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {course.duration}
          </span>
          {course.facilitator && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {course.facilitator.split("—")[0].trim()}
            </span>
          )}
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-border pt-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Mulai dari</p>
            <p className="font-display text-2xl font-bold text-primary">
              RM{course.price.toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground"> /peserta</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-base group-hover:gap-2">
            Butiran <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
};
