import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/anim/reveal";
import { works as staticWorks } from "@/lib/site";
import { useCms } from "@/hooks/use-cms";

export function Work() {
  const cms = useCms();
  const worksList = cms.works && cms.works.length > 0 ? cms.works : staticWorks;

  return (
    <section id="work" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-36">
      <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal>
            <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
              <span className="inline-block h-px w-10 bg-primary" />
              Selected Work
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
              Frames we're <span className="text-gradient-red">proud of.</span>
            </h2>
          </Reveal>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {worksList.map((w, i) => (
          <motion.a
            key={w.title}
            href="#contact"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: (i % 2) * 0.1 }}
            className={`group relative block overflow-hidden rounded-3xl border border-white/10 ${
              i % 3 === 0 ? "sm:col-span-2" : ""
            }`}
          >
            <div className={`relative overflow-hidden bg-black/60 ${i % 3 === 0 ? "aspect-[16/9]" : "aspect-[4/5]"}`}>
              <img
                src={w.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 size-full object-cover opacity-30 blur-xl scale-110 pointer-events-none select-none"
              />
              <img
                src={w.image}
                alt={`${w.title} — ${w.category}`}
                width={1200}
                height={1500}
                loading="lazy"
                className="relative z-10 size-full object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>
            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-background via-background/20 to-transparent opacity-90" />
            <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between p-6 sm:p-8">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary">{w.category}</p>
                <h3 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {w.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{w.year}</p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full glass text-foreground transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowUpRight className="size-5" />
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}