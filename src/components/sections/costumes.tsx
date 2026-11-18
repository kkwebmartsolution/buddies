import { motion } from "motion/react";
import {
  Sparkles,
  Crown,
  Shirt,
  Palette,
  Shield,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { Reveal, ScaleReveal } from "@/components/anim/reveal";
import { Magnetic } from "@/components/anim/magnetic";
import { site as staticSite, whatsappUrl as staticWhatsappUrl } from "@/lib/site";
import { defaultCmsData } from "@/lib/cms-defaults";
import { useCms } from "@/hooks/use-cms";

const iconMap: Record<string, LucideIcon> = {
  Crown,
  Palette,
  Shield,
  Shirt,
  Sparkles,
};

function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.952 3.71 1.453 5.711 1.454h.005c6.554 0 11.89-5.336 11.893-11.893a11.82 11.82 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function Costumes() {
  const cms = useCms();
  const site = cms.site || staticSite;
  const costumes = cms.costumes || defaultCmsData.costumes;
  const rawNumber = site.social?.whatsapp || "919876543210";
  const defaultCostumeMessage = encodeURIComponent(
    costumes.whatsappMessage ||
      "Hi Buddies Production, I want to rent character costumes for my shoot. Please share available catalog and sizes."
  );
  const whatsappUrl = `https://wa.me/${rawNumber}?text=${defaultCostumeMessage}`;
  const categoriesList = costumes.categories || defaultCmsData.costumes.categories;

  return (
    <section id="costumes" className="relative overflow-hidden py-24 sm:py-36">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-50" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section Header */}
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
                <span className="inline-block h-px w-10 bg-primary" />
                {costumes.tag || "Wardrobe & Styling"}
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
                {costumes.titleMain || "Character Costume"} <br />
                <span className="text-gradient-red">{costumes.titleRed || "Rentals & Wardrobe"}</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-md text-muted-foreground">
              {costumes.description}
            </p>
          </Reveal>
        </div>

        {/* Highlight Banner & Image */}
        <ScaleReveal>
          <div className="group relative mb-12 overflow-hidden rounded-3xl border border-white/10 bg-card/60 backdrop-blur">
            <div className="relative aspect-[16/9] max-h-[480px] w-full overflow-hidden sm:aspect-[21/9]">
              <img
                src={costumes.image || defaultCmsData.costumes.image}
                alt="Cinema & Theater Character Costume Rentals Room"
                loading="lazy"
                width={1400}
                height={600}
                className="size-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

              <div className="absolute inset-x-6 bottom-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-xl">
                  {costumes.badge && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-md">
                      <Sparkles className="size-3.5" />
                      {costumes.badge}
                    </span>
                  )}
                  <h3 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                    {costumes.bannerTitle || "Fitted, Dry-Cleaned & Ready For Shoot"}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    {costumes.bannerDesc || "Hundreds of ready character outfits, historical garments, crowns, accessories & on-set dresser support."}
                  </p>
                </div>

                <Magnetic>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-transform hover:scale-105 hover:bg-[#22c35e]"
                  >
                    <WhatsAppIcon className="size-5 fill-black" />
                    <span>{costumes.buttonText || "Enquire Costumes on WhatsApp"}</span>
                  </a>
                </Magnetic>
              </div>
            </div>
          </div>
        </ScaleReveal>

        {/* Costume Categories Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categoriesList.map((c, i) => {
            const Icon = iconMap[c.icon] || Crown;
            const itemWhatsappUrl = `https://wa.me/${rawNumber}?text=${encodeURIComponent(
              `Hi Buddies Production, I want to rent ${c.title} costumes for my project.`
            )}`;
            return (
              <motion.article
                key={c.title + i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-card/50 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80 hover:shadow-glow"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-6" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-foreground">
                      {c.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-foreground">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {c.desc}
                  </p>
                </div>

                <a
                  href={itemWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Rent ${c.title} on WhatsApp`}
                  className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-primary transition-colors group-hover:text-foreground"
                >
                  Rent on WhatsApp
                  <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
