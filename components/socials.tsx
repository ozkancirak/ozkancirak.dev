import React from "react";
import Link from "next/link";
import { SiGithub, SiThreads, SiX } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa6";

export type Social = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const socials: Social[] = [
  { name: "GitHub", href: "https://github.com/ozkancirak", icon: SiGithub },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/ozkancirak/", icon: FaLinkedinIn },
  { name: "X", href: "https://x.com/ozkcrk", icon: SiX },
  { name: "Threads", href: "https://www.threads.net/@ozkcrk", icon: SiThreads },
];

export function Socials() {
  return (
    <ul className="flex items-center gap-4">
      {socials.map((s) => {
        const Icon = s.icon;
        return (
          <li key={s.name}>
            <Link
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              title={s.name}
              className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="size-5" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
