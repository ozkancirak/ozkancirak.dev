"use client";

import { SiJavascript } from "react-icons/si";
import { Reveal } from "@/components/motion/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Stack() {
  return (
    <section className="pt-20 sm:pt-28">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">My stack</h2>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
          <Tooltip>
            <TooltipTrigger
              aria-label="JavaScript"
              className="group flex aspect-square w-full items-center justify-center rounded-2xl border border-border/40 bg-secondary/50 text-muted-foreground transition-colors duration-200 hover:border-border hover:bg-secondary hover:text-[#F7DF1E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
            >
              <SiJavascript className="size-7 sm:size-8 transition-colors duration-200" />
            </TooltipTrigger>
            <TooltipContent side="bottom">JavaScript</TooltipContent>
          </Tooltip>

          {Array.from({ length: 7 }).map((_, i) => (
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
