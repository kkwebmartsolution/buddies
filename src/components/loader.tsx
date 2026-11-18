import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { site } from "@/lib/site";

const easeTransition = [0.16, 1, 0.3, 1] as const;

interface LoaderProps {
  onDone?: () => void;
  isHome?: boolean;
}

/**
 * 1. VideoLoader: Plays the 100% exact same cinematic video preloader
 * only for the 1st time on the home screen.
 */
function VideoLoader({ onDone }: { onDone?: () => void }) {
  const [gone, setGone] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const handledRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const startTransition = useCallback(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("buddies_intro_seen", "true");
      } catch {
        // Ignore storage errors
      }
    }

    // 1. Immediately notify parent so the website underneath is ready and visible
    onDoneRef.current?.();

    // 2. Pause video so it sits on the final white frame cleanly
    if (videoRef.current) {
      videoRef.current.pause();
    }

    // 3. Trigger the cinematic white shutter transition
    setIsTransitioning(true);

    // 4. Remove loader completely from DOM after animation completes
    setTimeout(() => {
      setGone(true);
    }, 1100);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      startTransition();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Safety timeout: ensure site opens after 5s even if video stalls
    const safetyTimer = setTimeout(() => {
      startTransition();
    }, 5000);

    // Start video smoothly without restarting
    if (video.paused) {
      video.muted = true;
      video.play().catch(() => {
        try {
          video.muted = true;
          video.play().catch(() => startTransition());
        } catch {
          startTransition();
        }
      });
    }

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [startTransition]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    // Video is ~3.03s long and turns bright white around 2.7s - 2.9s.
    // Trigger the white ending transition right as it hits the white frame.
    if (video.currentTime >= 2.85 && !handledRef.current) {
      startTransition();
    }
  };

  if (gone) return null;

  return (
    <AnimatePresence>
      {!gone && (
        <div
          className={`fixed inset-0 z-[9999] w-screen h-screen select-none overflow-hidden pointer-events-none ${
            isTransitioning ? "bg-transparent" : "bg-black"
          }`}
          aria-label="Preloader"
        >
          {/* Fullscreen Video: Stays visible on its white frame throughout */}
          <video
            ref={videoRef}
            src="/uploads/buddies.mp4"
            playsInline
            autoPlay
            muted
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onEnded={startTransition}
            onError={startTransition}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* White Ending Transition: Clearly visible cinematic shutter reveal */}
          {isTransitioning && (
            <div className="absolute inset-0 z-50 overflow-hidden pointer-events-none">
              {/* Top Shutter: slides UP to reveal website */}
              <motion.div
                initial={{ y: "0%" }}
                animate={{ y: "-100%" }}
                transition={{ duration: 0.95, ease: easeTransition }}
                className="absolute top-0 left-0 right-0 h-[51vh] bg-white origin-top shadow-[0_30px_70px_rgba(255,255,255,0.7)]"
              />

              {/* Bottom Shutter: slides DOWN to reveal website */}
              <motion.div
                initial={{ y: "0%" }}
                animate={{ y: "100%" }}
                transition={{ duration: 0.95, ease: easeTransition }}
                className="absolute bottom-0 left-0 right-0 h-[51vh] bg-white origin-bottom shadow-[0_-30px_70px_rgba(255,255,255,0.7)]"
              />

              {/* Central Glowing Horizon Flash */}
              <motion.div
                initial={{ opacity: 1, scaleX: 1 }}
                animate={{ opacity: 0, scaleX: 1.6 }}
                transition={{ duration: 0.65, ease: easeTransition }}
                className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[4px] bg-white shadow-[0_0_60px_25px_rgba(255,255,255,1)]"
              />

              {/* Smooth White Dissolve Flash */}
              <motion.div
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: easeTransition }}
                className="absolute inset-0 bg-white pointer-events-none"
              />
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * 2. NormalLoader: The clean cinematic counter & brand loader
 * used on rentals, other pages, and reloads after the first intro.
 */
function NormalLoader({ onDone }: { onDone?: () => void }) {
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setCount(100);
      setGone(true);
      onDone?.();
      return;
    }

    let frame = 0;
    const start = performance.now();
    const total = 450;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / total);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * 100));
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setGone(true);
          onDone?.();
        }, 100);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  if (gone) return null;

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.4, ease: easeTransition }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-hero-glow opacity-70" />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeTransition }}
            className="relative flex flex-col items-center gap-6 px-6 text-center"
          >
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.5em] text-muted-foreground">
              {site.location.label.split(",")[1]?.trim() ?? "Guwahati"}
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
              {site.shortName}
              <span className="text-primary">.</span>
            </h1>
            <div className="h-px w-40 overflow-hidden bg-white/10">
              <motion.div
                className="h-full bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: count / 100 }}
                style={{ transformOrigin: "left" }}
                transition={{ ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Main Loader: Automatically chooses VideoLoader for the first-time home visit,
 * and NormalLoader for rentals, other pages, or reloads.
 */
export function Loader({ onDone, isHome = false }: LoaderProps) {
  const [shouldShowVideo, setShouldShowVideo] = useState(() => {
    if (typeof window === "undefined") return false;
    // Check if on home page and hasn't seen the intro yet
    const isActuallyHome = isHome || window.location.pathname === "/";
    const hasSeenIntro = sessionStorage.getItem("buddies_intro_seen") === "true";
    return isActuallyHome && !hasSeenIntro;
  });

  useEffect(() => {
    const isActuallyHome = isHome || window.location.pathname === "/";
    const hasSeenIntro = sessionStorage.getItem("buddies_intro_seen") === "true";
    setShouldShowVideo(isActuallyHome && !hasSeenIntro);
  }, [isHome]);

  if (shouldShowVideo) {
    return <VideoLoader onDone={onDone} />;
  }

  return <NormalLoader onDone={onDone} />;
}