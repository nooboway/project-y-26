import coverHero from "@assets/generated_images/cover-hero.png";
import day1Hero from "@assets/generated_images/day1-hero.png";
import day2Hero from "@assets/generated_images/day2-hero.png";
import day3Hero from "@assets/generated_images/day3-hero.png";
import day4Hero from "@assets/generated_images/day4-hero.png";
import birthdayFloral from "@assets/generated_images/birthday-floral.png";
import gallery1 from "@assets/generated_images/gallery-1.png";
import gallery2 from "@assets/generated_images/gallery-2.png";
import gallery3 from "@assets/generated_images/gallery-3.png";
import gallery4 from "@assets/generated_images/gallery-4.png";

export const IMG = {
  coverHero,
  day1Hero,
  day2Hero,
  day3Hero,
  day4Hero,
  birthdayFloral,
  gallery: [gallery1, gallery2, gallery3, gallery4],
};

export function heroForDay(slug: string, fallbackUrl?: string): string {
  if (fallbackUrl) return fallbackUrl;
  switch (slug) {
    case "day-1": return IMG.day1Hero;
    case "day-2": return IMG.day2Hero;
    case "day-3": return IMG.day3Hero;
    case "day-4": return IMG.day4Hero;
    case "day-5": return IMG.birthdayFloral;
    default: return IMG.coverHero;
  }
}

export function galleryFallback(i: number): string {
  return IMG.gallery[i % IMG.gallery.length];
}
