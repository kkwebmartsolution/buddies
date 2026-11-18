import { Instagram, MessageCircle, Youtube, Mail } from "lucide-react";
import {
  site as staticSite,
  navLinks,
  services as staticServices,
  whatsappUrl as staticWhatsappUrl,
  instagramUrl as staticInstagramUrl,
  youtubeUrl as staticYoutubeUrl,
} from "@/lib/site";
import { useCms } from "@/hooks/use-cms";

export function Footer() {
  const cms = useCms();
  const site = cms.site || staticSite;
  const servicesList = cms.services && cms.services.length > 0 ? cms.services : staticServices;
  const whatsappUrl = site.social?.whatsapp
    ? `https://wa.me/${site.social.whatsapp}?text=${encodeURIComponent(site.social.whatsappMessage || "")}`
    : staticWhatsappUrl;
  const instagramUrl = site.social?.instagram
    ? `https://instagram.com/${site.social.instagram}`
    : staticInstagramUrl;
  const youtubeUrl = site.social?.youtube
    ? `https://youtube.com/${site.social.youtube}`
    : staticYoutubeUrl;

  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-card/40">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <a href="/" className="font-display text-3xl font-bold tracking-tight">
              {site.shortName}
              <span className="text-primary">.</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {site.tagline}
            </p>
          </div>

          <nav aria-label="Quick links">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Quick Links
            </h3>
            <ul className="mt-5 space-y-3">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Services">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Services
            </h3>
            <ul className="mt-5 space-y-3">
              {servicesList.slice(0, 5).map((s) => (
                <li key={s.no}>
                  <a
                    href="/#services"
                    className="text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Connect
            </h3>
            <p className="mt-5 max-w-xs text-sm text-muted-foreground">{site.location.address}</p>
            <div className="mt-5 flex gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="grid size-11 place-items-center rounded-full glass transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <MessageCircle className="size-5" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid size-11 place-items-center rounded-full glass transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="grid size-11 place-items-center rounded-full glass transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Youtube className="size-5" />
              </a>
              <a
                href={`mailto:${site.social.email}`}
                aria-label="Email"
                className="grid size-11 place-items-center rounded-full glass transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Mail className="size-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="text-center">
            Powered by{" "}
            <a
              href="https://kkwebmart.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              KKWEBMART
            </a>
          </p>
          <p>Crafted frame by frame in Guwahati, Assam.</p>
        </div>
      </div>
    </footer>
  );
}