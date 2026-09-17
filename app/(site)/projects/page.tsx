import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Reveal } from "@/components/motion/reveal";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected projects and open source tools built from idea to launch.",
  alternates: { canonical: "/projects" },
};

function ProjectRowSkeleton() {
  return (
    <div className="py-7 sm:py-8 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-xl bg-secondary/80" />
        <Skeleton className="h-5 w-36 rounded bg-secondary/80" />
      </div>

      <div className="mt-3 space-y-2">
        <Skeleton className="h-3.5 w-4/5 rounded bg-secondary/60" />
        <Skeleton className="h-3.5 w-3/5 rounded bg-secondary/40" />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-3 w-16 rounded bg-secondary/50" />
        <Skeleton className="h-3 w-14 rounded bg-secondary/40" />
        <Skeleton className="h-3 w-20 rounded bg-secondary/40" />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Skeleton className="h-4 w-20 rounded bg-secondary/50" />
        <Skeleton className="h-4 w-18 rounded bg-secondary/40" />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <Reveal>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="mt-2 text-muted-foreground">
          Things I&apos;ve shipped, maintained, or kept around because
          they&apos;re still useful.
        </p>
      </Reveal>

      <div className="mt-6 divide-y divide-dashed divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <Reveal key={i} delay={i * 0.06}>
            <ProjectRowSkeleton />
          </Reveal>
        ))}
      </div>
    </Container>
  );
}

