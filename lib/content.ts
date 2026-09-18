// Site content. Customize all values here for your personal portfolio.

export type Project = {
  slug: string;
  name: string;
  description: string;
  detail?: string;
  tech?: string[];
  year: string;
  url?: string;
  githubUrl?: string;
  appStoreUrl?: string;
  badge?: { label: string; tone: "accent" | "muted" };
  stars?: number;
  forks?: number;
  monogram: string;
  logo?: string;
  logoStyle?: "icon" | "mark";
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "screencraft",
    name: "ScreenCraft",
    description: "Record your screen, edit clips, and download or share — directly in your browser.",
    detail: "Zero install and no account needed. Open a tab and record with native WebCodecs acceleration.",
    tech: ["Next.js", "TypeScript", "WebCodecs", "IndexedDB", "Tailwind CSS"],
    year: "2025",
    url: "https://example.com",
    githubUrl: "https://github.com/example/screencraft",
    badge: { label: "Live", tone: "accent" },
    monogram: "S",
    logo: "/placeholder-logo-1.svg",
    logoStyle: "mark",
    featured: true,
  },
  {
    slug: "audiolink",
    name: "AudioLink",
    description: "High-fidelity, ultra-low latency wireless audio streaming between devices.",
    detail: "Connect over local Wi-Fi or USB with real-time Opus encoding and zero cloud dependence.",
    tech: ["Rust", "Tauri", "TypeScript", "Opus", "WebRTC"],
    year: "2024",
    url: "https://example.com",
    githubUrl: "https://github.com/example/audiolink",
    badge: { label: "Live", tone: "accent" },
    monogram: "A",
    logo: "/placeholder-logo-2.svg",
    logoStyle: "icon",
    featured: true,
  },
  {
    slug: "mediahub",
    name: "MediaHub",
    description: "Lightweight, extensible desktop media player and streaming aggregator.",
    detail: "Speak open protocol standards with custom hardware-accelerated playback.",
    tech: ["Rust", "React", "TypeScript", "Tailwind CSS"],
    year: "2024",
    url: "https://example.com",
    githubUrl: "https://github.com/example/mediahub",
    badge: { label: "Live", tone: "accent" },
    monogram: "M",
    logo: "/placeholder-logo-3.svg",
    logoStyle: "mark",
  },
];

export type Experience = {
  company: string;
  role: string;
  period: string;
  url?: string;
  description?: string;
};

export const experience: Experience[] = [
  {
    company: "İstanbul Aydın University",
    role: "IT Support Intern",
    period: "2024 — 2025",
    url: "https://www.aydin.edu.tr",
  },
];


export const availability = {
  period: "Now",
  status: "Available for work",
  detail: "Open to freelance and full-time roles.",
};

export const siteUrl = "https://ozkancirak.dev";
export const siteDomain = "ozkancirak.dev";

export const profile = {
  fullName: "Özkan Çırak",
  displayName: "Özkan",
  alternateNames: ["Özkan Çırak", "ozkancirak", "ozkan"],
  role: "Full-Stack Developer & IT Specialist",
  greeting: "Özkan Çırak",
  tagline: {
    before: "",
    highlight: "Full-Stack Developer & IT Specialist",
    after: " who loves building things from idea to launch.",
  },
  email: "contact@ozkancirak.dev",
  avatar: "/avatar-placeholder.svg",
  githubUsername: "ozkancirak",
  sourceUrl: "https://github.com/ozkancirak/ozkancirak.dev",
  sameAs: [
    "https://github.com/ozkancirak",
    "https://www.linkedin.com/in/ozkancirak/",
    // "https://x.com/ozkancirak",
  ],
};
