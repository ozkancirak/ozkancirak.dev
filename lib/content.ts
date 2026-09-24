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
    slug: "ration",
    name: "Ration",
    description: "AI coding quotas in your Windows tray.",
    detail: "Tracks session and weekly limits, reset times, and token costs across providers.",
    tech: ["C#", ".NET", "WinUI 3"],
    year: "2026",
    githubUrl: "https://github.com/ozkancirak/Ration",
    badge: { label: "Open Source", tone: "accent" },
    monogram: "R",
    logo: "/projects/ration.svg",
    logoStyle: "icon",
    featured: true,
  },
  {
    slug: "temu-local-filter",
    name: "Temu Local Filter",
    description: "Hide local warehouse items on Temu.",
    detail: "Filters out local sellers so you only see international listings.",
    tech: ["JavaScript", "Chrome Extensions API"],
    year: "2025",
    githubUrl: "https://github.com/ozkancirak/temu-local-filter",
    badge: { label: "Open Source", tone: "accent" },
    monogram: "T",
    logo: "/projects/temu-local-filter.svg",
    logoStyle: "icon",
    featured: true,
  },
];

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  url: string;
  platform?: "Medium" | "Substack" | "Dev.to" | "Personal";
  readTime?: string;
  featured?: boolean;
};

export const posts: Post[] = [];

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

export const siteUrl = "https://www.ozkancirak.dev";
export const siteDomain = "ozkancirak.dev";

export const profile = {
  fullName: "Özkan Çırak",
  displayName: "Özkan",
  alternateNames: ["Özkan Çırak", "ozkancirak", "ozkan"],
  role: "Full-Stack Developer",
  greeting: "Özkan Çırak",
  tagline: {
    before: "",
    highlight: "Full-Stack Developer",
    after: " building things from idea to launch.",
  },
  email: "contact@ozkancirak.dev",
  avatar: "/avatar-placeholder.svg",
  githubUsername: "ozkancirak",
  sourceUrl: "https://github.com/ozkancirak/ozkancirak.dev",
  sameAs: [
    "https://github.com/ozkancirak",
    "https://www.linkedin.com/in/ozkancirak/",
    "https://x.com/ozkcrk",
    "https://www.threads.net/@ozkcrk",
  ],
};
