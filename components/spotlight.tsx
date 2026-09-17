import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProjectLogo } from "@/components/project-logo";
import { projects, type Project } from "@/lib/content";

function SpotlightCard({ project, delay }: { project: Project; delay: number }) {
  const href = project.url ?? "/projects";
  const external = Boolean(project.url);

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
        <h3 className="mt-6 font-semibold">{project.name}</h3>
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
          The apple of my{" "}
          <Image
            src="/green-eye-accent.svg"
            alt="eye"
            width={328}
            height={312}
            unoptimized
            className="inline-block h-[1.5em] w-auto -translate-y-1 select-none"
          />{" "}
          — the projects I care about a little too much.
        </p>
      </Reveal>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {featured.map((project, i) => (
          <SpotlightCard key={project.slug} project={project} delay={i * 0.08} />
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
