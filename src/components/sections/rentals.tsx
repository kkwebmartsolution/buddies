import { motion } from "motion/react";
import {
  Camera,
  Aperture,
  Lightbulb,
  Plane,
  Mic,
  Move,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/anim/reveal";
import { Magnetic } from "@/components/anim/magnetic";
import { rentals as staticRentals, whatsappUrl as staticWhatsappUrl } from "@/lib/site";
import { useCms } from "@/hooks/use-cms";

const easeOut = [0.16, 1, 0.3, 1] as const;

const iconMap: Record<string, LucideIcon> = {
  Camera,
  Aperture,
  Lightbulb,
  Plane,
  Mic,
  Move,
};

export function Rentals() {
  const cms = useCms();
  const rentalsList = cms.rentals && cms.rentals.length > 0 ? cms.rentals : staticRentals;
  const whatsappUrl = cms.site?.social?.whatsapp
    ? `https://wa.me/${cms.site.social.whatsapp}?text=${encodeURIComponent(cms.site.social.whatsappMessage || "")}`
    : staticWhatsappUrl;

  return (
    <section id="rentals" className="relative overflow-hidden py-24 sm:py-36">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
                <span className="inline-block h-px w-10 bg-primary" />
                Rental Services
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl">
                Premium Equipment
                <br />
                <span className="text-gradient-red">Rental Services</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-muted-foreground">
              From cameras to lights, our top-notch equipment is available for rent to bring your
              creative vision to life — with expert support whenever you need it.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rentalsList.map((r, i) => {
            const Icon = iconMap[r.icon] ?? Camera;
            return (
              <motion.article
                key={r.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: easeOut, delay: (i % 3) * 0.08 }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-card/60 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={r.image}
                    alt={`${r.title} — cinema rental gear`}
                    loading="lazy"
                    width={944}
                    height={704}
                    className="size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  <span className="absolute left-4 top-4 grid size-11 place-items-center rounded-2xl glass text-primary transition-colors duration-500 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="absolute right-4 top-4 rounded-full glass px-3 py-1 text-xs font-semibold text-foreground">
                    {r.tag}
                  </span>
                </div>
                <div className="relative flex flex-1 flex-col p-7">
                  <h3 className="font-display text-2xl font-bold tracking-tight">{r.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Book ${r.title}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors group-hover:text-foreground"
                  >
                    Book this kit
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-card/60 p-8 backdrop-blur sm:flex-row sm:p-10">
            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Need a custom package?
              </h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                Tell us your shoot and we'll build a tailored rental quote — with delivery and
                on-set support available.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Magnetic>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform glow-red hover:scale-[1.03] sm:w-auto"
                >
                  Book Now
                  <ArrowUpRight className="size-4" />
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/5 sm:w-auto"
                >
                  Get a Quote
                </a>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
