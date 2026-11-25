import { motion } from "motion/react";
import { Reveal } from "@/components/anim/reveal";
import { services as staticServices } from "@/lib/site";
import { useCms } from "@/hooks/use-cms";

export function Services() {
  const cms = useCms();
  const servicesList = cms.services && cms.services.length > 0 ? cms.services : staticServices;

  return (
    <section id="services" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-36">
      <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal>
            <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
              <span className="inline-block h-px w-10 bg-primary" />
              What we do
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
              Services, <span className="text-gradient-red">start to screen.</span>
            </h2>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <p className="max-w-sm text-muted-foreground">
            End-to-end production under one roof — no hand-offs, no lost vision.
          </p>
        </Reveal>
      </div>

      <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-muted sm:grid-cols-2 lg:grid-cols-3">
        {servicesList.map((s, i) => (
          <motion.article
            key={s.no}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: (i % 3) * 0.08 }}
            className="group relative bg-background p-8 transition-colors duration-500 hover:bg-card sm:p-10"
          >
            <span className="font-display text-sm font-semibold text-primary">{s.no}</span>
            <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            <span className="mt-8 block h-px w-0 bg-primary transition-all duration-500 group-hover:w-16" />
          </motion.article>
        ))}
      </div>
    </section>
  );
}