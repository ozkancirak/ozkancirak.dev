import type { IconType } from "react-icons";
import {
  SiTypescript,
  SiReact,
  SiNextdotjs,
  SiJavascript,
  SiTailwindcss,
  SiNodedotjs,
  SiFramer,
  SiGit,
} from "react-icons/si";
import { Reveal } from "@/components/motion/reveal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Tech = { name: string; icon: IconType; color: string };

const stack: Tech[] = [
  { name: "TypeScript", icon: SiTypescript, color: "#3178C6" },
  { name: "React", icon: SiReact, color: "#149ECA" },
  { name: "Next.js", icon: SiNextdotjs, color: "var(--foreground)" },
  { name: "JavaScript", icon: SiJavascript, color: "#EAB308" },
  { name: "Tailwind CSS", icon: SiTailwindcss, color: "#06B6D4" },
  { name: "Node.js", icon: SiNodedotjs, color: "#5FA04E" },
  { name: "Framer Motion", icon: SiFramer, color: "#0055FF" },
  { name: "Git", icon: SiGit, color: "#F05032" },
];

export function Stack() {
  return (
    <section className="pt-20 sm:pt-28">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">My stack</h2>
      </Reveal>

      <Reveal delay={0.08}>
        <ul className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
          {stack.map(({ name, icon: Icon, color }) => (
            <li key={name}>
              <Tooltip>
                <TooltipTrigger
                  aria-label={name}
                  style={{ "--brand": color } as React.CSSProperties}
                  className="group grid aspect-square w-full place-items-center rounded-2xl bg-secondary text-muted-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Icon className="size-7 transition-colors group-hover:text-(--brand)" />
                </TooltipTrigger>
                <TooltipContent side="bottom">{name}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
