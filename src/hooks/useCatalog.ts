import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCourseImage, getRoomImage } from "@/data/catalog";

export type CourseRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  duration: string;
  price: number;
  group_price: number | null;
  early_bird_price: number | null;
  early_bird_until: string | null;
  sibling_price: number | null;
  status: "Ada Tempat" | "Hampir Penuh" | "Penuh";
  short_desc: string;
  syllabus: string[];
  prerequisites: string | null;
  facilitator: string | null;
  certificate: string | null;
  image: string;
  is_featured: boolean;
  hrdc_claimable: boolean;
};

export type SlotRow = {
  id: string;
  course_id: string;
  date_label: string;
  time_label: string;
  seats_total: number;
  seats_taken: number;
  seats_left: number;
};

export type SeatingLayout = {
  name: string;
  capacity: number;
};

export type RoomRow = {
  id: string;
  slug: string;
  name: string;
  capacity: number;
  hourly_rate: number;
  daily_rate: number;
  facilities: string[];
  description: string | null;
  image: string;
  seating_layouts: SeatingLayout[];
};

const mapCourse = (r: any): CourseRow => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  category: r.category,
  duration: r.duration,
  price: Number(r.price),
  group_price: r.group_price !== null ? Number(r.group_price) : null,
  early_bird_price: r.early_bird_price != null ? Number(r.early_bird_price) : null,
  early_bird_until: r.early_bird_until ?? null,
  sibling_price: r.sibling_price != null ? Number(r.sibling_price) : null,
  status: r.status,
  short_desc: r.short_desc,
  syllabus: Array.isArray(r.syllabus) ? r.syllabus : [],
  prerequisites: r.prerequisites,
  facilitator: r.facilitator,
  certificate: r.certificate,
  image: r.image_url || getCourseImage(r.slug),
  is_featured: !!r.is_featured,
  hrdc_claimable: !!r.hrdc_claimable,
});

const mapRoom = (r: any): RoomRow => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  capacity: r.capacity,
  hourly_rate: Number(r.hourly_rate),
  daily_rate: Number(r.daily_rate),
  facilities: Array.isArray(r.facilities) ? r.facilities : [],
  description: r.description,
  image: r.image_url || getRoomImage(r.slug),
  seating_layouts: Array.isArray(r.seating_layouts)
    ? r.seating_layouts
        .filter((s: any) => s && typeof s.name === "string")
        .map((s: any) => ({ name: String(s.name), capacity: Number(s.capacity) || 0 }))
    : [],
});

export const useCourses = () =>
  useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<CourseRow[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapCourse);
    },
  });

export const useCourseBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ["course", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data: course, error } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      if (!course) return null;
      const { data: slots, error: slotsErr } = await supabase
        .from("course_slots")
        .select("*")
        .eq("course_id", course.id)
        .order("sort_order", { ascending: true });
      if (slotsErr) throw slotsErr;
      const slotsMapped: SlotRow[] = (slots ?? []).map((s: any) => ({
        id: s.id,
        course_id: s.course_id,
        date_label: s.date_label,
        time_label: s.time_label,
        seats_total: s.seats_total,
        seats_taken: s.seats_taken,
        seats_left: Math.max(0, s.seats_total - s.seats_taken),
      }));
      return { course: mapCourse(course), slots: slotsMapped };
    },
  });

export const useFeaturedCourses = () =>
  useQuery({
    queryKey: ["featured-courses"],
    queryFn: async (): Promise<CourseRow[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapCourse);
    },
  });

export const useRooms = () =>
  useQuery({
    queryKey: ["rooms"],
    queryFn: async (): Promise<RoomRow[]> => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapRoom);
    },
  });

export type RoomAddon = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sort_order: number;
};

export const useRoomAddons = () =>
  useQuery({
    queryKey: ["room-addons"],
    queryFn: async (): Promise<RoomAddon[]> => {
      const { data, error } = await supabase
        .from("room_addons")
        .select("id, name, description, price, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((a: any) => ({ ...a, price: Number(a.price) }));
    },
  });
