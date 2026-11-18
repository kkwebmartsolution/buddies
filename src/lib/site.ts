import work1 from "@/assets/work-1.jpg";
import work2 from "@/assets/work-2.jpg";
import work3 from "@/assets/work-3.jpg";
import work4 from "@/assets/work-4.jpg";
import rentalCamera from "@/assets/rental-camera.jpg";
import rentalLenses from "@/assets/rental-lenses.jpg";
import rentalLighting from "@/assets/rental-lighting.jpg";
import rentalDrone from "@/assets/rental-drone.jpg";
import rentalAudio from "@/assets/rental-audio.jpg";
import rentalGimbal from "@/assets/rental-gimbal.jpg";

export const site = {
  name: "Buddies Production",
  shortName: "Buddies",
  tagline: "Cinematic stories, crafted frame by frame.",
  description:
    "Buddies Production is a premium film & video production studio in Guwahati, Assam — crafting cinematic commercials, music videos, documentaries and wedding films.",
  location: {
    label: "Narikal Bari, Guwahati, Assam 781024",
    address: "5QCQ+46F, Narikal Bari, Guwahati, Assam 781024",
    // Update to your real coordinates/place if needed.
    mapsQuery: "5QCQ+46F Narikal Bari Guwahati Assam 781024",
  },
  social: {
    // Replace the number and handle with your real WhatsApp & Instagram.
    whatsapp: "919876543210",
    whatsappMessage: "Hi Buddies Production, I'd love to talk about a project.",
    instagram: "buddiesproduction",
    youtube: "@buddiesproduction",
    email: "hello@buddiesproduction.in",
  },
} as const;

export const whatsappUrl = `https://wa.me/${site.social.whatsapp}?text=${encodeURIComponent(
  site.social.whatsappMessage,
)}`;
export const instagramUrl = `https://instagram.com/${site.social.instagram}`;
export const youtubeUrl = `https://youtube.com/${site.social.youtube}`;
export const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  site.location.mapsQuery,
)}&output=embed`;
export const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  site.location.mapsQuery,
)}`;

export const navLinks = [
  { label: "Work", href: "/#work" },
  { label: "Videos", href: "/#videos" },
  { label: "Services", href: "/#services" },
  { label: "Rentals", href: "/rentals" },
  { label: "Dubbing", href: "/#dubbing" },
  { label: "Costumes", href: "/#costumes" },
  { label: "Studio", href: "/#studio" },
  { label: "Contact", href: "/#contact" },
] as const;

export const services = [
  {
    no: "01",
    title: "Commercials & Ads",
    body: "High-impact brand films and TV commercials engineered to sell, shot with cinema-grade craft.",
  },
  {
    no: "02",
    title: "Music Videos",
    body: "Bold, rhythm-driven visuals with striking art direction that make artists unforgettable.",
  },
  {
    no: "03",
    title: "Documentaries",
    body: "Honest, emotional storytelling — from concept and interviews to the final graded cut.",
  },
  {
    no: "04",
    title: "Wedding Films",
    body: "Timeless cinematic wedding films that turn a single day into a story worth reliving.",
  },
  {
    no: "05",
    title: "Post Production",
    body: "Editing, sound design, VFX and colour grading that give every frame its final polish.",
  },
  {
    no: "06",
    title: "Aerial & Drone",
    body: "Sweeping cinematic aerials and dynamic movement that add scale and drama to any scene.",
  },
] as const;

export const works = [
  { title: "Velocity", category: "Automotive Commercial", year: "2025", image: work1 },
  { title: "Neon Nights", category: "Music Video", year: "2025", image: work2 },
  { title: "The Quiet Hour", category: "Documentary", year: "2024", image: work3 },
  { title: "Forever & A Day", category: "Wedding Film", year: "2024", image: work4 },
] as const;

export const stats = [
  { value: "250+", label: "Films delivered" },
  { value: "80+", label: "Brands & artists" },
  { value: "12", label: "Years in craft" },
  { value: "40M+", label: "Views generated" },
] as const;

/**
 * Featured YouTube videos. Replace `youtubeId` with your real video IDs
 * (the part after `watch?v=` in a YouTube URL).
 */
export const videos = [
  {
    youtubeId: "ScMzIvxBSi4",
    title: "Velocity — Automotive Film",
    category: "Commercial",
    description:
      "A high-octane brand film shot on cinema glass — engineered motion, dramatic lighting and a soundtrack built to sell.",
  },
  {
    youtubeId: "b7k0a5hYnSI",
    title: "Neon Nights",
    category: "Music Video",
    description:
      "Rhythm-driven visuals and bold art direction. Every cut lands on the beat to make the artist unforgettable.",
  },
  {
    youtubeId: "aqz-KE-bpKQ",
    title: "The Quiet Hour",
    category: "Documentary",
    description:
      "Honest, emotional storytelling — from the first interview to the final graded cut, crafted to move an audience.",
  },
  {
    youtubeId: "LXb3EKWsInQ",
    title: "Forever & A Day",
    category: "Wedding Film",
    description:
      "A timeless cinematic wedding film that turns a single day into a story worth reliving, frame by frame.",
  },
] as const;

/**
 * Rental services — cinema gear available to hire. `icon` maps to a
 * lucide-react icon name used in the Rentals section.
 */
export const rentals = [
  {
    icon: "Camera",
    title: "Cinema Cameras",
    description:
      "RED, ARRI & Sony cinema bodies with pro media, ready for any format from commercials to features.",
    tag: "From ₹8,000 / day",
    image: rentalCamera,
  },
  {
    icon: "Aperture",
    title: "Prime & Zoom Lenses",
    description:
      "Full sets of cinema primes and zooms — sharp, characterful glass for every focal length you need.",
    tag: "From ₹2,500 / day",
    image: rentalLenses,
  },
  {
    icon: "Lightbulb",
    title: "Lighting Kits",
    description:
      "Aputure, Nanlux & HMI lighting with modifiers, stands and grip to shape dramatic, cinematic looks.",
    tag: "From ₹4,000 / day",
    image: rentalLighting,
  },
  {
    icon: "Plane",
    title: "Drones & Aerial",
    description:
      "Licensed drone rigs for sweeping cinematic aerials, with certified pilots available on request.",
    tag: "From ₹6,000 / day",
    image: rentalDrone,
  },
  {
    icon: "Mic",
    title: "Audio & Sound",
    description:
      "Boom kits, lav sets, field recorders and monitoring for clean, broadcast-ready production sound.",
    tag: "From ₹3,000 / day",
    image: rentalAudio,
  },
  {
    icon: "Move",
    title: "Gimbals & Movement",
    description:
      "Sliders, dollies, gimbals and stabilised rigs to add smooth, dynamic motion to every shot.",
    tag: "From ₹2,000 / day",
    image: rentalGimbal,
  },
] as const;