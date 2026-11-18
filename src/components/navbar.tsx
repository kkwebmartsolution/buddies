import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Magnetic } from "@/components/anim/magnetic";
import { navLinks, site as staticSite, whatsappUrl as staticWhatsappUrl } from "@/lib/site";
import { useCms } from "@/hooks/use-cms";

export function Navbar() {
  const cms = useCms();
  const site = cms.site || staticSite;
  const whatsappUrl = site.social?.whatsapp
    ? `https://wa.me/${site.social.whatsapp}?text=${encodeURIComponent(site.social.whatsappMessage || "")}`
    : staticWhatsappUrl;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <nav
          className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-500 sm:px-8 ${
            scrolled ? "my-3 rounded-full py-3 glass" : "py-6"
          }`}
        >
          <a
            href="/"
            className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground"
            aria-label={`${site.name} — home`}
          >
            {site.shortName}
            <span className="text-primary">.</span>
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="relative text-sm text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Magnetic className="hidden md:block">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform glow-red hover:scale-[1.03]"
              >
                Start a project
              </a>
            </Magnetic>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="grid size-11 place-items-center rounded-full glass text-foreground md:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Left side sliding mobile menu drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />

            {/* Left Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-[70] flex w-[85%] max-w-xs flex-col justify-between border-r border-white/10 bg-background/95 p-6 backdrop-blur-2xl shadow-2xl md:hidden"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <a
                    href="/"
                    onClick={() => setOpen(false)}
                    className="font-display text-2xl font-bold tracking-tight text-foreground"
                  >
                    {site.shortName}
                    <span className="text-primary">.</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="grid size-10 place-items-center rounded-full glass text-foreground hover:bg-white/10"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <ul className="mt-8 flex flex-col gap-5">
                  {navLinks.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="font-display text-2xl font-semibold text-foreground/90 transition-colors hover:text-primary"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-white/10 pt-6">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-red"
                >
                  Start a project
                </a>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {site.tagline}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}