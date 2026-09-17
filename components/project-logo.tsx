import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/content";

/**
 * Renders a project's logo in a consistent square. Handles three cases:
 * full-bleed app icons, transparent marks (padded on a surface), and a
 * monogram fallback when no image is provided.
 */
export function ProjectLogo({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const box = cn("relative size-10 shrink-0 overflow-hidden rounded-lg", className);

  if (project.logo && project.logoStyle === "icon") {
    return (
      <div className={box}>
        <Image
          src={project.logo}
          alt=""
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>
    );
  }

  if (project.logo && project.logoStyle === "mark") {
    return (
      <div className={cn(box, "bg-secondary")}>
        <Image
          src={project.logo}
          alt=""
          fill
          sizes="40px"
          className="object-contain p-2"
        />
      </div>
    );
  }

  return (
    <span
      className={cn(
        box,
        "grid place-items-center bg-foreground text-lg font-bold text-background"
      )}
    >
      {project.monogram}
    </span>
  );
}
