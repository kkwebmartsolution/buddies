import { useState } from "react";
import { Play, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/anim/reveal";
import { videos as staticVideos } from "@/lib/site";
import { useCms } from "@/hooks/use-cms";

type Video = {
  youtubeId: string;
  title: string;
  category: string;
  description?: string;
};

function VideoCard({ v }: { v: Video }) {
  const [playing, setPlaying] = useState(false);
  const url = `https://www.youtube.com/watch?v=${v.youtubeId}`;
  const thumb = `https://i.ytimg.com/vi/${v.youtubeId}/maxresdefault.jpg`;

  return (
    <article className="w-[78vw] shrink-0 sm:w-[46vw] lg:w-[32vw] xl:w-[28rem]">
      <div className="group relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-card shadow-elevate">
        {playing ? (
          <iframe
            className="size-full"
            src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&rel=0`}
            title={v.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${v.title}`}
            className="absolute inset-0 size-full"
          >
            <img
              src={thumb}
              alt={`${v.title} — video thumbnail`}
              loading="lazy"
              className="size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
              }}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform duration-500 group-hover:scale-110">
                <Play className="size-6 translate-x-0.5 fill-current" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-primary">{v.category}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="group/link">
            <h3 className="mt-1 font-display text-xl font-bold tracking-tight transition-colors group-hover/link:text-primary">
              {v.title}
            </h3>
          </a>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Watch ${v.title} on YouTube`}
          className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-white/5"
        >
          YouTube
          <ArrowUpRight className="size-3.5" />
        </a>
      </div>
    </article>
  );
}

function Row({ items, direction }: { items: Video[]; direction: "left" | "right" }) {
  // Repeat the source list so one "set" is always wider than the viewport,
  // then render that set twice: translating exactly -50% makes the seam invisible.
  const reps = Math.max(1, Math.ceil(4 / Math.max(items.length, 1)));
  const set: Video[] = Array.from({ length: reps }, () => items).flat();

  return (
    <div className="group/row relative overflow-hidden">
      <div
        className={`flex w-max gap-6 sm:gap-8 ${
          direction === "left" ? "animate-track-left" : "animate-track-right"
        } [animation-play-state:running] group-hover/row:[animation-play-state:paused]`}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-6 sm:gap-8" aria-hidden={copy === 1}>
            {set.map((v, i) => (
              <VideoCard key={`${copy}-${v.youtubeId}-${i}`} v={v} />
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent sm:w-32" />
    </div>
  );
}

export function Videos() {
  const cms = useCms();
  const videosList = cms.videos && cms.videos.length > 0 ? cms.videos : staticVideos;
  const half = Math.ceil(videosList.length / 2);
  const rowOne = videosList.slice(0, half);
  const rowTwo = videosList.slice(half).length ? videosList.slice(half) : videosList.slice(0, half);

  return (
    <section id="videos" className="relative overflow-hidden py-24 sm:py-36">
      <div className="mx-auto mb-16 flex max-w-7xl flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal>
            <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
              <span className="inline-block h-px w-10 bg-primary" />
              Watch
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
              Stories in <span className="text-gradient-red">motion.</span>
            </h2>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <p className="max-w-sm text-muted-foreground">
            Press play, or open any film on YouTube to watch in full quality.
          </p>
        </Reveal>
      </div>

      <div className="flex flex-col gap-10 sm:gap-14">
        <Row items={[...rowOne]} direction="left" />
        <Row items={[...rowTwo]} direction="right" />
      </div>
    </section>
  );
}
