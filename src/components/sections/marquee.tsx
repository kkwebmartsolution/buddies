import { useCms } from "@/hooks/use-cms";

const defaultItems = [
  "Commercials",
  "Music Videos",
  "Documentaries",
  "Wedding Films",
  "Colour Grading",
  "Sound Design",
  "Aerial",
  "Story",
];

export function Marquee() {
  const cms = useCms();
  const partnerItems = cms.partners && cms.partners.length > 0 ? cms.partners : defaultItems;
  const row = [...partnerItems, ...partnerItems];
  return (
    <div className="border-y border-white/10 bg-background py-6">
      <div className="flex overflow-hidden">
        <div className="flex shrink-0 animate-marquee items-center gap-8 pr-8">
          {row.map((item, i) => (
            <div key={i} className="flex items-center gap-8">
              <span className="font-display text-2xl font-semibold text-foreground/80 sm:text-3xl">
                {item}
              </span>
              <span className="text-primary">●</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}