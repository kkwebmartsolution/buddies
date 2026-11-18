import { Reveal, ScaleReveal, WordReveal } from "@/components/anim/reveal";
import { stats as staticStats } from "@/lib/site";
import staticAboutImg from "@/assets/about.jpg";
import { useCms } from "@/hooks/use-cms";

export function About() {
  const cms = useCms();
  const aboutData = cms.about;
  const statsList = aboutData?.stats && aboutData.stats.length > 0 ? aboutData.stats : staticStats;
  const imageSrc = aboutData?.aboutImage || staticAboutImg;

  return (
    <section id="about" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-36">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <Reveal>
            <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
              <span className="inline-block h-px w-10 bg-primary" />
              {aboutData?.tag || "The Studio"}
            </p>
          </Reveal>
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            <WordReveal text={aboutData?.titleMain || "A crew of storytellers obsessed with the"} />{" "}
            <span className="text-gradient-red">
              <WordReveal text={aboutData?.titleRed || "perfect frame."} />
            </span>
          </h2>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {aboutData?.description ||
                "Buddies Production is a full-service film studio based in Guwahati, Assam. From the first spark of an idea to the final graded frame, we handle direction, cinematography, editing and sound in-house — so every project keeps its soul from script to screen."}
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:grid-cols-2">
            {statsList.map((s, i) => (
              <Reveal key={s.label} delay={0.05 * i}>
                <div>
                  <div className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                    {s.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <ScaleReveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10">
            <img
              src={imageSrc}
              alt="Film crew around a cinema camera on set with dramatic red lighting"
              width={1200}
              height={1408}
              loading="lazy"
              className="aspect-[4/5] size-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-5">
              <p className="font-display text-lg font-semibold">
                {aboutData?.cardTitle || "Behind every frame"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {aboutData?.cardDesc ||
                  "Directors, DOPs, editors and colourists — one team, one vision."}
              </p>
            </div>
          </div>
        </ScaleReveal>
      </div>
    </section>
  );
}