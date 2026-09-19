import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectLogo } from "@/components/project-logo";
import { projects, type Project } from "@/lib/content";

function SpotlightCardSkeleton({ delay }: { delay: number }) {
  return (
    <Reveal delay={delay} as="div" className="h-full">
      <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <Skeleton className="size-10 rounded-lg bg-secondary/80" />
          <Skeleton className="size-4 rounded bg-secondary/50" />
        </div>
        <Skeleton className="mt-6 h-5 w-2/5 rounded bg-secondary/90" />
        <Skeleton className="mt-3 h-3.5 w-4/5 rounded bg-secondary/60" />
        <Skeleton className="mt-2 h-3.5 w-3/5 rounded bg-secondary/40" />
      </div>
    </Reveal>
  );
}

function SpotlightCard({ project, delay }: { project: Project; delay: number }) {
  const href = project.url ?? project.githubUrl ?? "/projects";
  const external = Boolean(project.url || project.githubUrl);

  return (
    <Reveal delay={delay} as="div" className="h-full">
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
      >
        <div className="flex items-start justify-between">
          <ProjectLogo project={project} />
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <h3 className="mt-6 font-semibold tracking-tight text-foreground">{project.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
      </Link>
    </Reveal>
  );
}

export function Spotlight() {
  const featured = projects.filter((p) => p.featured);

  return (
    <section className="pt-20 sm:pt-28">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Spotlight</h2>
        <p className="mt-2 text-muted-foreground">
          The projects I care about a little too much.
        </p>
      </Reveal>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {featured.map((project, i) => (
          <SpotlightCard key={project.slug} project={project} delay={i * 0.08} />
        ))}
        {Array.from({ length: Math.max(0, 2 - featured.length) }).map((_, i) => (
          <SpotlightCardSkeleton key={`skeleton-${i}`} delay={(featured.length + i) * 0.08} />
        ))}
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
