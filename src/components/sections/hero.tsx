import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, Lightbulb } from "lucide-react";
import { Magnetic } from "@/components/anim/magnetic";
import { whatsappUrl, instagramUrl } from "@/lib/site";
import heroImg from "@/assets/hero.jpg";
import { useCms } from "@/hooks/use-cms";

const easeOut = [0.16, 1, 0.3, 1] as const;

function NetflixWordSwitcher({ customWords }: { customWords?: string[] }) {
  const words = customWords && customWords.length > 0
    ? customWords
    : ["cinema.", "videos.", "songs.", "albums.", "commercials.", "films."];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2800);

    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, scale: 1.35, filter: "blur(14px) brightness(1.8)", y: 6 }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", y: 0 }}
          exit={{ opacity: 0, scale: 0.75, filter: "blur(10px) brightness(0.4)", y: -6 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative block text-gradient-red pr-3 drop-shadow-[0_0_35px_rgba(220,38,38,0.7)]"
        >
          {words[index]}

          {/* Netflix Optical Red Laser Beam Sweep */}
          <motion.span
            key={`flare-${index}`}
            initial={{ left: "-100%", opacity: 0 }}
            animate={{ left: "120%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.75, ease: "easeInOut", delay: 0.15 }}
            className="pointer-events-none absolute top-1/2 h-[3px] w-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_20px_#ef4444,0_0_40px_#ef4444]"
            aria-hidden="true"
          />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Hero() {
  const cms = useCms();
  const heroData = cms.hero;
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.to(imgRef.current, {
        yPercent: 22,
        scale: 1.15,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="site-hero relative isolate flex min-h-dvh items-end overflow-hidden"
    >
      <div className="hero-image absolute inset-0 -z-10 scale-110">
        <img
          ref={imgRef}
          src={heroImg}
          alt="Cinema camera on a crane lit with dramatic red light on a dark film set"
          width={1920}
          height={1088}
          fetchPriority="high"
          className="size-full object-cover"
        />
      </div>
      <div className="hero-overlay absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-background/30" />
      <div className="hero-glow absolute inset-0 -z-10 bg-hero-glow" />

      <div className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.2 }}
          className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground"
        >
          <span className="inline-block h-px w-10 bg-primary" />
          {heroData?.subtitle || "Film & Video Production Studio"}
        </motion.p>

        <h1 className="font-display text-[clamp(2.75rem,9vw,8rem)] font-bold leading-[0.92] tracking-tight">
          <span className="block overflow-hidden">
            <motion.span
              className="block text-gradient"
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1, ease: easeOut, delay: 0.3 }}
            >
              {heroData?.line1 || "We make"}
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="block"
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1, ease: easeOut, delay: 0.42 }}
            >
              <NetflixWordSwitcher customWords={heroData?.line2Words} />
            </motion.span>
          </span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut, delay: 0.6 }}
          className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
        >
          <p className="max-w-md text-base text-muted-foreground sm:text-lg">
            {heroData?.paragraph ||
              "A premium production studio in Guwahati crafting commercials, music videos, documentaries and wedding films with obsessive cinematic detail."}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Magnetic>
              <a
                href="/rentals"
                className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform glow-red hover:scale-[1.03]"
              >
                <Lightbulb className="size-4 fill-current" />
                Jollywood Light Rentals
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Start a project
              </a>
            </Magnetic>
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#work"
        aria-label="Scroll to work"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-muted-foreground md:block"
      >
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="inline-block"
        >
          <ArrowDown className="size-5" />
        </motion.span>
      </motion.a>
      <a href={instagramUrl} className="sr-only">
        Instagram
      </a>
    </section>
  );
}
