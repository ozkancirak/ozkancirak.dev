import type { Metadata } from "next";
import { Funnel_Sans, Bricolage_Grotesque } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SmoothScroll } from "@/components/smooth-scroll";
import { profile, siteUrl, siteDomain } from "@/lib/content";

const funnelSans = Funnel_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const description =
  `${profile.fullName} — Full-Stack Developer & IT Specialist, building things from idea to launch.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteDomain,
    template: `%s — ${siteDomain}`,
  },
  description,
  applicationName: siteDomain,
  authors: [{ name: profile.fullName, url: siteUrl }],
  creator: profile.fullName,
  publisher: profile.fullName,
  alternates: { canonical: "/" },
  keywords: [profile.fullName, ...profile.alternateNames, siteDomain],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    title: `${siteDomain} — full-stack dev`,
    description,
    url: siteUrl,
    siteName: siteDomain,
    type: "profile",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: `${siteDomain} — full-stack dev`,
    description,
  },
};

/**
 * schema.org entity graph. Without this, search engines see a domain rather
 * than a person: `alternateName` is what makes the ASCII spelling and the short
 * name resolve to the same identity, and `sameAs` ties the social profiles in.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: profile.fullName,
      alternateName: profile.alternateNames,
      givenName: "Developer",
      familyName: "Portfolio",
      url: siteUrl,
      image: `${siteUrl}${profile.avatar}`,
      email: `mailto:${profile.email}`,
      jobTitle: profile.role,
      description,
      sameAs: profile.sameAs,
      knowsAbout: [
        "Web Development",
        "TypeScript",
        "React",
        "Next.js",
        "Rust",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteDomain,
      alternateName: profile.fullName,
      description,
      inLanguage: "en",
      publisher: { "@id": `${siteUrl}/#person` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${funnelSans.variable} ${bricolage.variable} h-full`} suppressHydrationWarning>
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) add
          attributes to <body> before hydration; ignore those mismatches. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SmoothScroll />
          <TooltipProvider delay={120}>{children}</TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
