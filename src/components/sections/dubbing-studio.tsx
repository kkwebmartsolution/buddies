import { motion } from "motion/react";
import {
  Mic,
  Headphones,
  Volume2,
  Radio,
  Music,
  Sliders,
  Sparkles,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Reveal, ScaleReveal } from "@/components/anim/reveal";
import { Magnetic } from "@/components/anim/magnetic";
import { site as staticSite, whatsappUrl as staticWhatsappUrl } from "@/lib/site";
import { defaultCmsData } from "@/lib/cms-defaults";
import { useCms } from "@/hooks/use-cms";

const iconMap: Record<string, LucideIcon> = {
  Mic,
  Headphones,
  Volume2,
  Radio,
  Music,
  Sliders,
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

export function DubbingStudio() {
  const cms = useCms();
  const site = cms.site || staticSite;
  const dubbing = cms.dubbing || defaultCmsData.dubbing;
  const rawNumber = site.social?.whatsapp || "919876543210";
  const bookingMessage = encodeURIComponent(
    dubbing.whatsappMessage ||
      "Hi Buddies Production, I want to book a slot for the Dubbing & Recording Studio. Please share available timings and rates."
  );
  const whatsappBookingUrl = `https://wa.me/${rawNumber}?text=${bookingMessage}`;
  const featuresList = dubbing.features || defaultCmsData.dubbing.features;

  return (
    <section id="dubbing" className="relative overflow-hidden py-24 sm:py-36">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-50" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section Header */}
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
                <span className="inline-block h-px w-10 bg-primary" />
                {dubbing.tag || "Studio Booking"}
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
                {dubbing.titleMain || "Dubbing & Sound"} <br />
                <span className="text-gradient-red">{dubbing.titleRed || "Recording Studio"}</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-md text-muted-foreground">
              {dubbing.description}
            </p>
          </Reveal>
        </div>

        {/* Showcase Grid */}
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Studio Image & Booking Card */}
          <div className="lg:col-span-7">
            <ScaleReveal>
              <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card/60 backdrop-blur">
                <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]">
                  <img
                    src={dubbing.image || defaultCmsData.dubbing.image}
                    alt="Professional Dubbing & Audio Recording Studio in Guwahati"
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  
                  {/* Floating Badges */}
                  {dubbing.badge1 && (
                    <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 backdrop-blur-md">
                      <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-white">{dubbing.badge1}</span>
                    </div>
                  )}

                  {dubbing.badge2 && (
                    <div className="absolute right-5 top-5 rounded-full border border-primary/30 bg-primary/20 px-3.5 py-1.5 backdrop-blur-md">
                      <span className="text-xs font-semibold text-primary">{dubbing.badge2}</span>
                    </div>
                  )}

                  {/* Overlay Action */}
                  <div className="absolute inset-x-5 bottom-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/75 p-6 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">
                        {dubbing.cardTitle || "Book Your Studio Session"}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dubbing.cardDesc || "Instant slot reservation & sound engineer assistance"}
                      </p>
                    </div>

                    {/* Prominent WhatsApp Logo Button */}
                    <Magnetic>
                      <a
                        href={whatsappBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Book studio session on WhatsApp"
                        className="inline-flex items-center justify-center gap-3 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-black shadow-[0_0_25px_rgba(37,211,102,0.35)] transition-transform hover:scale-105 hover:bg-[#22c35e]"
                      >
                        <WhatsAppIcon className="size-5 fill-black" />
                        <span>{dubbing.buttonText || "Book on WhatsApp"}</span>
                      </a>
                    </Magnetic>
                  </div>
                </div>
              </div>
            </ScaleReveal>
          </div>

          {/* Features Column */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Reveal>
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="size-3.5" />
                  Broadcast Grade Production
                </span>
                <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Crafted for Crystal-Clear Voice & Sound
                </h3>
              </div>
            </Reveal>

            <div className="grid gap-4">
              {featuresList.map((f, i) => {
                const Icon = iconMap[f.icon] || Mic;
                return (
                  <motion.div
                    key={f.title + i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="flex items-start gap-4 rounded-2xl border border-white/5 bg-card/40 p-4 transition-colors hover:border-primary/30 hover:bg-card/70"
                  >
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{f.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Direct WhatsApp Callout */}
            <Reveal delay={0.2}>
              <div className="mt-2 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-primary/5 p-5 sm:flex-row">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                  <span className="text-xs text-muted-foreground">
                    Direct confirmation via WhatsApp chat with our sound engineer.
                  </span>
                </div>
                <Magnetic>
                  <a
                    href={whatsappBookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-bold text-black transition-transform hover:scale-105"
                  >
                    <WhatsAppIcon className="size-4 fill-black" />
                    {dubbing.buttonText || "WhatsApp Booking"}
                  </a>
                </Magnetic>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
