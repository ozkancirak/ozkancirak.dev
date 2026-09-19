"use client";

import React from "react";
import { SiGit, SiJavascript } from "react-icons/si";
import { Reveal } from "@/components/motion/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Tech = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const stack: Tech[] = [
  { name: "JavaScript", icon: SiJavascript, color: "#F7DF1E" },
  { name: "Git", icon: SiGit, color: "#F05032" },
];

export function Stack() {
  const remainingSkeletons = Math.max(0, 8 - stack.length);

  return (
    <section className="pt-20 sm:pt-28">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">My stack</h2>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
          {stack.map((tech) => {
            const Icon = tech.icon;
            return (
              <Tooltip key={tech.name}>
                <TooltipTrigger
                  aria-label={tech.name}
                  style={{ "--brand": tech.color } as React.CSSProperties}
                  className="group flex aspect-square w-full items-center justify-center rounded-2xl border border-border/40 bg-secondary/50 text-muted-foreground transition-colors duration-200 hover:border-border hover:bg-secondary hover:text-(--brand) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
                >
                  <Icon className="size-7 sm:size-8 transition-colors duration-200" />
                </TooltipTrigger>
                <TooltipContent side="bottom">{tech.name}</TooltipContent>
              </Tooltip>
            );
          })}

          {Array.from({ length: remainingSkeletons }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex aspect-square w-full items-center justify-center rounded-2xl border border-border/40"
            >
              <div className="size-6 rounded-lg bg-background/20" />
            </Skeleton>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
