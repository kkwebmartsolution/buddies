import { MapPin, Instagram, MessageCircle, ArrowUpRight } from "lucide-react";
import { Reveal, ScaleReveal } from "@/components/anim/reveal";
import { Magnetic } from "@/components/anim/magnetic";
import { site as staticSite, mapsEmbedUrl as staticMapsEmbedUrl, mapsLinkUrl as staticMapsLinkUrl, whatsappUrl as staticWhatsappUrl, instagramUrl as staticInstagramUrl } from "@/lib/site";
import { useCms } from "@/hooks/use-cms";

export function Studio() {
  const cms = useCms();
  const site = cms.site || staticSite;
  const address = cms.studio?.address || site.location.address;
  const whatsappUrl = site.social?.whatsapp
    ? `https://wa.me/${site.social.whatsapp}?text=${encodeURIComponent(site.social.whatsappMessage || "")}`
    : staticWhatsappUrl;
  const instagramUrl = site.social?.instagram
    ? `https://instagram.com/${site.social.instagram}`
    : staticInstagramUrl;
  const mapsLinkUrl = cms.studio?.mapsQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cms.studio.mapsQuery)}`
    : staticMapsLinkUrl;
  const mapsEmbedUrl = cms.studio?.mapsQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(cms.studio.mapsQuery)}&output=embed`
    : staticMapsEmbedUrl;

  return (
    <section id="studio" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-36">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col justify-between">
          <div>
            <Reveal>
              <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
                <span className="inline-block h-px w-10 bg-primary" />
                Visit The Studio
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
                Find us in <span className="text-gradient-red">Guwahati.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-8 flex items-start gap-3 text-muted-foreground">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <a
                  href={mapsLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-xs text-lg transition-colors hover:text-foreground"
                >
                  {address}
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Magnetic className="flex-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl bg-primary px-6 py-5 text-primary-foreground transition-transform glow-red hover:scale-[1.02]"
                >
                  <span className="flex items-center gap-3 font-semibold">
                    <MessageCircle className="size-5" />
                    Chat on WhatsApp
                  </span>
                  <ArrowUpRight className="size-5" />
                </a>
              </Magnetic>
              <Magnetic className="flex-1">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border px-6 py-5 text-foreground transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-3 font-semibold">
                    <Instagram className="size-5" />
                    Follow on Instagram
                  </span>
                  <ArrowUpRight className="size-5" />
                </a>
              </Magnetic>
            </div>
          </Reveal>
        </div>

        <ScaleReveal>
          <div className="relative overflow-hidden rounded-3xl border border-border">
            <iframe
              title={`Map showing ${site.name} in Guwahati`}
              src={mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-square size-full grayscale contrast-125 [color-scheme:dark] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[420px]"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/20" />
          </div>
        </ScaleReveal>
      </div>
    </section>
  );
}