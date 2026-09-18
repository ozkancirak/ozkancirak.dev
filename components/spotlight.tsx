import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Skeleton } from "@/components/ui/skeleton";

function SpotlightCardSkeleton({ delay }: { delay: number }) {
  return (
    <Reveal delay={delay} as="div" className="h-full">
      <div className="flex h-full flex-col justify-between rounded-xl border border-border bg-card p-5">
        <div>
          <div className="flex items-start justify-between">
            <Skeleton className="size-10 rounded-lg bg-secondary/80" />
            <Skeleton className="size-4 rounded bg-secondary/50" />
          </div>
          <Skeleton className="mt-6 h-5 w-2/5 rounded bg-secondary/90" />
          <Skeleton className="mt-3 h-3.5 w-4/5 rounded bg-secondary/60" />
          <Skeleton className="mt-2 h-3.5 w-3/5 rounded bg-secondary/40" />
        </div>
        <div className="mt-6 flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded bg-secondary/50" />
          <Skeleton className="h-4 w-16 rounded bg-secondary/40" />
        </div>
      </div>
    </Reveal>
  );
}

export function Spotlight() {
  return (
    <section className="pt-20 sm:pt-28">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Spotlight</h2>
        <p className="mt-2 text-muted-foreground">
          The projects I care about a little too much.
        </p>
      </Reveal>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <SpotlightCardSkeleton delay={0} />
        <SpotlightCardSkeleton delay={0.08} />
      </div>

      <Reveal delay={0.16}>
        <Link
          href="/projects"
          className="group mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all projects
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Reveal>
    </section>
  );
}
