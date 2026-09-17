import Link from "next/link";
import { SiNextdotjs } from "react-icons/si";
import { Container } from "@/components/container";
import { profile } from "@/lib/content";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-50 border-t border-border bg-background">
      <Container className="flex h-16 items-center justify-between text-xs text-muted-foreground sm:text-sm">
        {/* The only place the first name sits in plain body copy, and crawlers
            weigh visible text over metadata. Surname stays in the JSON-LD. */}
        <span>
          © {year} {profile.displayName}
        </span>

        <div className="flex items-center gap-5">
          <Link
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            Built with
            <SiNextdotjs className="size-4" aria-label="Next.js" />
          </Link>
        </div>
      </Container>
    </footer>
  );
}
