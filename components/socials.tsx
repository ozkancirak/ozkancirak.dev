import React from "react";
import Link from "next/link";
import { SiGithub, SiX, SiHackerone, SiDiscord } from "react-icons/si";

export type Social = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const socials: Social[] = [
  { name: "GitHub", href: "https://github.com/ozkancirak", icon: SiGithub },
  { name: "X", href: "https://x.com/ozkancirak", icon: SiX },
  { name: "HackerOne", href: "https://hackerone.com", icon: SiHackerone },
  { name: "Discord", href: "https://discord.com", icon: SiDiscord },
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
