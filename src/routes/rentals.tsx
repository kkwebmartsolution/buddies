import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SmoothScroll } from "@/components/anim/smooth-scroll";
import { Loader } from "@/components/loader";
import { Navbar } from "@/components/navbar";
import { Rentals } from "@/components/sections/rentals";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/footer";
import { site } from "@/lib/site";

export const Route = createFileRoute("/rentals")({
  component: RentalsPage,
  head: () => ({
    links: [{ rel: "canonical", href: "/rentals" }],
    meta: [
      {
        title: `Equipment Rental Services — ${site.name}`,
      },
      {
        name: "description",
        content:
          "Rent professional cinema gear in Guwahati, Assam — cameras, lenses, lighting, drones, audio and gimbals from Buddies Production.",
      },
    ],
  }),
});

function RentalsPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "/rentals" }),
    }).catch(() => {});
  }, []);

  return (
    <SmoothScroll>
      <Loader onDone={() => setReady(true)} />
      <div className="film-grain" aria-hidden="true" />
      <Navbar />
      <main
        className={`relative pt-20 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      >
        <Rentals />
        <Contact />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
