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
import aboutImg from "@/assets/about.jpg";
import dubbingStudioImg from "@/assets/dubbing-studio.jpg";
import costumeRentalImg from "@/assets/costume-rental.jpg";

export interface CmsData {
  site: {
    theme: "light" | "dark";
    name: string;
    shortName: string;
    tagline: string;
    description: string;
    location: {
      label: string;
      address: string;
      mapsQuery: string;
    };
    social: {
      whatsapp: string;
      whatsappMessage: string;
      instagram: string;
      youtube: string;
      email: string;
    };
  };
  hero: {
    subtitle: string;
    line1: string;
    line2Words: string[];
    paragraph: string;
  };
  about: {
    tag: string;
    titleMain: string;
    titleRed: string;
    description: string;
    cardTitle: string;
    cardDesc: string;
    aboutImage: string;
    stats: Array<{ value: string; label: string }>;
  };
  services: Array<{
    no: string;
    title: string;
    body: string;
  }>;
  works: Array<{
    id?: number | string;
    title: string;
    client?: string;
    category: string;
    year: string;
    image: string;
  }>;
  videos: Array<{
    id?: number | string;
    youtubeId: string;
    title: string;
    category: string;
    description: string;
  }>;
  rentals: Array<{
    id?: number | string;
    icon: string;
    title: string;
    description: string;
    tag: string;
    image: string;
  }>;
  dubbing: {
    tag: string;
    titleMain: string;
    titleRed: string;
    description: string;
    image: string;
    badge1: string;
    badge2: string;
    cardTitle: string;
    cardDesc: string;
    buttonText: string;
    whatsappMessage: string;
    features: Array<{
      icon: string;
      title: string;
      desc: string;
    }>;
  };
  costumes: {
    tag: string;
    titleMain: string;
    titleRed: string;
    description: string;
    image: string;
    badge: string;
    bannerTitle: string;
    bannerDesc: string;
    buttonText: string;
    whatsappMessage: string;
    categories: Array<{
      icon: string;
      title: string;
      tag: string;
      desc: string;
    }>;
  };
  partners: string[];
  studio: {
    address: string;
    mapsQuery: string;
  };
}

export const defaultCmsData: CmsData = {
  site: {
    theme: "dark",
    name: "Buddies Production",
    shortName: "Buddies",
    tagline: "Cinematic stories, crafted frame by frame.",
    description:
      "Buddies Production is a premium film & video production studio in Guwahati, Assam — crafting cinematic commercials, music videos, documentaries and wedding films.",
    location: {
      label: "Narikal Bari, Guwahati, Assam 781024",
      address: "5QCQ+46F, Narikal Bari, Guwahati, Assam 781024",
      mapsQuery: "5QCQ+46F Narikal Bari Guwahati Assam 781024",
    },
    social: {
      whatsapp: "919876543210",
      whatsappMessage: "Hi Buddies Production, I'd love to talk about a project.",
      instagram: "buddiesproduction",
      youtube: "@buddiesproduction",
      email: "hello@buddiesproduction.in",
    },
  },
  hero: {
    subtitle: "Film & Video Production Studio",
    line1: "We make",
    line2Words: ["cinema.", "videos.", "songs.", "albums.", "commercials.", "films."],
    paragraph:
      "A premium production studio in Guwahati crafting commercials, music videos, documentaries and wedding films with obsessive cinematic detail.",
  },
  about: {
    tag: "The Studio",
    titleMain: "A crew of storytellers obsessed with the",
    titleRed: "perfect frame.",
    description:
      "Buddies Production is a full-service film studio based in Guwahati, Assam. From the first spark of an idea to the final graded frame, we handle direction, cinematography, editing and sound in-house — so every project keeps its soul from script to screen.",
    cardTitle: "Behind every frame",
    cardDesc: "Directors, DOPs, editors and colourists — one team, one vision.",
    aboutImage: aboutImg,
    stats: [
      { value: "250+", label: "Films delivered" },
      { value: "80+", label: "Brands & artists" },
      { value: "12", label: "Years in craft" },
      { value: "40M+", label: "Views generated" },
    ],
  },
  services: [
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
  ],
  works: [
    { id: 1, title: "Velocity", category: "Automotive Commercial", year: "2025", image: work1 },
    { id: 2, title: "Neon Nights", category: "Music Video", year: "2025", image: work2 },
    { id: 3, title: "The Quiet Hour", category: "Documentary", year: "2024", image: work3 },
    { id: 4, title: "Forever & A Day", category: "Wedding Film", year: "2024", image: work4 },
  ],
  videos: [
    {
      id: 1,
      youtubeId: "ScMzIvxBSi4",
      title: "Velocity — Automotive Film",
      category: "Commercial",
      description:
        "A high-octane brand film shot on cinema glass — engineered motion, dramatic lighting and a soundtrack built to sell.",
    },
    {
      id: 2,
      youtubeId: "b7k0a5hYnSI",
      title: "Neon Nights",
      category: "Music Video",
      description:
        "Rhythm-driven visuals and bold art direction. Every cut lands on the beat to make the artist unforgettable.",
    },
    {
      id: 3,
      youtubeId: "aqz-KE-bpKQ",
      title: "The Quiet Hour",
      category: "Documentary",
      description:
        "Honest, emotional storytelling — from the first interview to the final graded cut, crafted to move an audience.",
    },
    {
      id: 4,
      youtubeId: "LXb3EKWsInQ",
      title: "Forever & A Day",
      category: "Wedding Film",
      description:
        "A timeless cinematic wedding film that turns a single day into a story worth reliving, frame by frame.",
    },
  ],
  rentals: [
    {
      id: 1,
      icon: "Camera",
      title: "Cinema Cameras",
      description:
        "RED, ARRI & Sony cinema bodies with pro media, ready for any format from commercials to features.",
      tag: "From ₹8,000 / day",
      image: rentalCamera,
    },
    {
      id: 2,
      icon: "Aperture",
      title: "Prime & Zoom Lenses",
      description:
        "Full sets of cinema primes and zooms — sharp, characterful glass for every focal length you need.",
      tag: "From ₹2,500 / day",
      image: rentalLenses,
    },
    {
      id: 3,
      icon: "Lightbulb",
      title: "Lighting Kits",
      description:
        "Aputure, Nanlux & HMI lighting with modifiers, stands and grip to shape dramatic, cinematic looks.",
      tag: "From ₹4,000 / day",
      image: rentalLighting,
    },
    {
      id: 4,
      icon: "Plane",
      title: "Drones & Aerial",
      description:
        "Licensed drone rigs for sweeping cinematic aerials, with certified pilots available on request.",
      tag: "From ₹6,000 / day",
      image: rentalDrone,
    },
    {
      id: 5,
      icon: "Mic",
      title: "Audio & Sound",
      description:
        "Boom kits, lav sets, field recorders and monitoring for clean, broadcast-ready production sound.",
      tag: "From ₹3,000 / day",
      image: rentalAudio,
    },
    {
      id: 6,
      icon: "Move",
      title: "Gimbals & Movement",
      description:
        "Sliders, dollies, gimbals and stabilised rigs to add smooth, dynamic motion to every shot.",
      tag: "From ₹2,000 / day",
      image: rentalGimbal,
    },
  ],
  dubbing: {
    tag: "Studio Booking",
    titleMain: "Dubbing & Sound",
    titleRed: "Recording Studio",
    description:
      "Guwahati's premier soundproof acoustic facility for cinema dubbing, song recording, dialogue ADR, podcasts, and commercial voiceovers — fully equipped with industry-standard gear.",
    image: dubbingStudioImg,
    badge1: "Slots Available Now",
    badge2: "Acoustic Treated Booth",
    cardTitle: "Book Your Studio Session",
    cardDesc: "Instant slot reservation & sound engineer assistance",
    buttonText: "Book on WhatsApp",
    whatsappMessage:
      "Hi Buddies Production, I want to book a slot for the Dubbing & Recording Studio. Please share available timings and rates.",
    features: [
      {
        icon: "Mic",
        title: "Cinema Dubbing Booth",
        desc: "Acoustically isolated vocal suite with multi-layer soundproofing for clean, resonant voice takes.",
      },
      {
        icon: "Headphones",
        title: "Vocal & Music Recording",
        desc: "High-end studio condenser mics (Neumann, Shure, AKG) for singers, voiceover artists & podcasts.",
      },
      {
        icon: "Volume2",
        title: "Foley, SFX & Audio Post",
        desc: "Dedicated Foley space, custom sound design, ADR, audio restoration and stereo/5.1 cinematic mix.",
      },
      {
        icon: "Radio",
        title: "Live Video Sync Monitoring",
        desc: "Zero-latency picture-to-sound sync playback monitors for flawless dubbing and character timing.",
      },
    ],
  },
  costumes: {
    tag: "Wardrobe & Styling",
    titleMain: "Character Costume",
    titleRed: "Rentals & Wardrobe",
    description:
      "Bring your characters to life with our extensive rental inventory of cinema-grade period costumes, cultural attires, dramatic theater outfits, and custom styling props in Guwahati.",
    image: costumeRentalImg,
    badge: "Full Wardrobe Catalog Available",
    bannerTitle: "Fitted, Dry-Cleaned & Ready For Shoot",
    bannerDesc:
      "Hundreds of ready character outfits, historical garments, crowns, accessories & on-set dresser support.",
    buttonText: "Enquire Costumes on WhatsApp",
    whatsappMessage:
      "Hi Buddies Production, I want to rent character costumes for my shoot. Please share available catalog and sizes.",
    categories: [
      {
        icon: "Crown",
        title: "Historical & Period Royalty",
        tag: "From ₹2,000 / day",
        desc: "Elaborate royal attire, embroidered robes, crowns, jewelry and velvet garments for period cinema & epics.",
      },
      {
        icon: "Palette",
        title: "Traditional & Cultural Outfits",
        tag: "From ₹1,200 / day",
        desc: "Authentic Assamese folk & cultural wardrobe, Bihu costumes, traditional silk drapes, turbans and ornaments.",
      },
      {
        icon: "Shield",
        title: "Theatrical, Action & Mythological",
        tag: "From ₹2,500 / day",
        desc: "Character armor, warrior vests, stage drama outfits, custom mythical character sets and prop weaponry.",
      },
      {
        icon: "Shirt",
        title: "Modern & Music Video Stylized",
        tag: "From ₹1,500 / day",
        desc: "High-fashion couture, edgy streetwear, leather jackets and designer ensembles tailored for screen visuals.",
      },
    ],
  },
  partners: [
    "Commercials",
    "Music Videos",
    "Documentaries",
    "Wedding Films",
    "Colour Grading",
    "Sound Design",
    "Aerial",
    "Story",
  ],
  studio: {
    address: "5QCQ+46F, Narikal Bari, Guwahati, Assam 781024",
    mapsQuery: "5QCQ+46F Narikal Bari Guwahati Assam 781024",
  },
};

export function deepMergeCmsData(base: CmsData, override: any): CmsData {
  if (!override || typeof override !== "object") return base;
  return {
    site: {
      ...base.site,
      ...(override.site || {}),
      location: { ...base.site.location, ...(override.site?.location || {}) },
      social: { ...base.site.social, ...(override.site?.social || {}) },
    },
    hero: { ...base.hero, ...(override.hero || {}) },
    about: {
      ...base.about,
      ...(override.about || {}),
      stats:
        override.about?.stats && Array.isArray(override.about.stats)
          ? override.about.stats
          : base.about.stats,
    },
    services:
      override.services && Array.isArray(override.services) ? override.services : base.services,
    works: override.works && Array.isArray(override.works) ? override.works : base.works,
    videos: override.videos && Array.isArray(override.videos) ? override.videos : base.videos,
    rentals: override.rentals && Array.isArray(override.rentals) ? override.rentals : base.rentals,
    dubbing: {
      ...base.dubbing,
      ...(override.dubbing || {}),
      features:
        override.dubbing?.features && Array.isArray(override.dubbing.features)
          ? override.dubbing.features
          : base.dubbing?.features,
    },
    costumes: {
      ...base.costumes,
      ...(override.costumes || {}),
      categories:
        override.costumes?.categories && Array.isArray(override.costumes.categories)
          ? override.costumes.categories
          : base.costumes?.categories,
    },
    partners:
      override.partners && Array.isArray(override.partners) ? override.partners : base.partners,
    studio: { ...base.studio, ...(override.studio || {}) },
  };
}
