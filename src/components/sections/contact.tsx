import { motion } from "motion/react";
import { MessageCircle, Instagram } from "lucide-react";
import { Magnetic } from "@/components/anim/magnetic";
import { WordReveal } from "@/components/anim/reveal";
import { whatsappUrl, instagramUrl } from "@/lib/site";

export function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden border-t border-white/10 py-28 sm:py-40">
      <div className="absolute inset-0 -z-10 bg-hero-glow opacity-80" />
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
        <p className="mb-8 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
          Let's roll camera
        </p>
        <h2 className="font-display text-[clamp(2.5rem,8vw,7rem)] font-bold leading-[0.95] tracking-tight">
          <WordReveal text="Have a story" className="block text-gradient" />
          <span className="block text-gradient-red">
            <WordReveal text="worth filming?" />
          </span>
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <Magnetic>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-transform glow-red hover:scale-[1.03]"
            >
              <MessageCircle className="size-5" />
              Message us on WhatsApp
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full border border-white/15 px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-white/5"
            >
              <Instagram className="size-5" />
              See more on Instagram
            </a>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}