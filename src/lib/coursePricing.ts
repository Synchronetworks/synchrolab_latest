import type { CourseRow } from "@/hooks/useCatalog";

export type PriceKind = "regular" | "early_bird" | "sibling";

export type EffectivePrice = {
  unit: number;
  kind: PriceKind;
  label: string;
  original: number;
  earlyBirdActive: boolean;
  siblingActive: boolean;
};

const todayKL = () => {
  const d = new Date();
  // Convert to Asia/Kuala_Lumpur (UTC+8) date only
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const kl = new Date(utc + 8 * 60 * 60_000);
  return new Date(kl.getFullYear(), kl.getMonth(), kl.getDate());
};

export const isEarlyBirdActive = (c: Pick<CourseRow, "early_bird_price" | "early_bird_until">) => {
  if (c.early_bird_price == null || !c.early_bird_until) return false;
  const until = new Date(c.early_bird_until + "T23:59:59+08:00");
  return todayKL().getTime() <= until.getTime();
};

export const computeEffectivePrice = (
  course: Pick<
    CourseRow,
    "price" | "early_bird_price" | "early_bird_until" | "sibling_price"
  >,
  numPax: number,
  isSibling: boolean = false,
): EffectivePrice => {
  let unit = course.price;
  let kind: PriceKind = "regular";
  let label = "Harga biasa";

  const ebActive = isEarlyBirdActive(course);
  if (ebActive && course.early_bird_price != null && course.early_bird_price < unit) {
    unit = course.early_bird_price;
    kind = "early_bird";
    label = "Harga Early Bird";
  }
  const sibActive = isSibling && numPax >= 2 && course.sibling_price != null;
  if (sibActive && course.sibling_price! < unit) {
    unit = course.sibling_price!;
    kind = "sibling";
    label = "Harga Adik Beradik";
  }

  return {
    unit,
    kind,
    label,
    original: course.price,
    earlyBirdActive: ebActive,
    siblingActive: sibActive,
  };
};
