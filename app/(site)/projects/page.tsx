import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { Container } from "@/components/container";
import { Reveal } from "@/components/motion/reveal";
import { ProjectLogo } from "@/components/project-logo";
import { projects, type Project } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected projects and open source tools built from idea to launch.",
  alternates: { canonical: "/projects" },
};

function MetaLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="size-3.5" />
      {children}
    </Link>
  );
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <div className="py-7 sm:py-8">
      <div className="flex items-center gap-3">
        <ProjectLogo project={project} className="size-9" />
        <h2 className="font-semibold text-foreground">{project.name}</h2>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {project.description}
        {project.detail ? ` ${project.detail}` : null}
      </p>

      {project.tech && (
        <p className="mt-3 text-xs text-muted-foreground/70">
          {project.tech.join(" · ")}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {project.url && (
          <MetaLink href={project.url} icon={ArrowUpRight}>
            Website
          </MetaLink>
        )}
        {project.githubUrl && (
          <MetaLink href={project.githubUrl} icon={SiGithub}>
            GitHub
          </MetaLink>
        )}
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
        {projects.map((project, i) => (
          <Reveal key={project.slug} delay={i * 0.06}>
            <ProjectRow project={project} />
          </Reveal>
        ))}
      </div>
    </Container>
  );
}

