import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SmoothScroll } from "@/components/anim/smooth-scroll";
import { Loader } from "@/components/loader";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/sections/hero";
import { Marquee } from "@/components/sections/marquee";
import { About } from "@/components/sections/about";
import { Services } from "@/components/sections/services";
import { Work } from "@/components/sections/work";
import { Videos } from "@/components/sections/videos";
import { DubbingStudio } from "@/components/sections/dubbing-studio";
import { Costumes } from "@/components/sections/costumes";
import { Studio } from "@/components/sections/studio";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/footer";
import { site, instagramUrl, whatsappUrl } from "@/lib/site";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: site.name,
          description: site.description,
          address: {
            "@type": "PostalAddress",
            streetAddress: site.location.address,
            addressLocality: "Guwahati",
            addressRegion: "Assam",
            postalCode: "781024",
            addressCountry: "IN",
          },
          areaServed: "Guwahati, Assam",
          sameAs: [instagramUrl, whatsappUrl],
        }),
      },
    ],
  }),
});

function Index() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "/" }),
    }).catch(() => {});
  }, []);

  return (
    <SmoothScroll>
      <Loader isHome onDone={() => setReady(true)} />
      <div className="film-grain" aria-hidden="true" />
      <Navbar />
      <main
        className={`relative transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      >
        <Hero />
        <Marquee />
        <About />
        <Services />
        <Work />
        <Videos />
        <DubbingStudio />
        <Costumes />
        <Studio />
        <Contact />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
