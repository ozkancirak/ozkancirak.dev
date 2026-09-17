import { Reveal } from "@/components/motion/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { availability } from "@/lib/content";

export function Experience() {
  return (
    <section className="pt-20 sm:pt-28">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Experience</h2>
      </Reveal>

      {/* Vertical timeline — the line encodes chronology and scales as more
          roles are added. */}
      <div className="relative mt-6 pl-7">
        <span
          aria-hidden
          className="absolute left-0 top-2 h-[calc(100%-1rem)] w-px bg-border"
        />
        <ol className="space-y-10">
          <Reveal as="li" className="relative">
            <span
              aria-hidden
              className="absolute -left-7 top-1.5 flex -translate-x-1/2"
            >
              <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
              <span className="relative block size-2.5 rounded-full bg-emerald-500 ring-4 ring-background" />
            </span>

            <p className="text-sm text-muted-foreground">{availability.period}</p>
            <h3 className="mt-1 text-lg font-semibold">{availability.status}</h3>
            <p className="mt-0.5 text-muted-foreground">{availability.detail}</p>
          </Reveal>

          {Array.from({ length: 2 }).map((_, i) => (
            <Reveal
              as="li"
              key={i}
              delay={(i + 1) * 0.08}
              className="relative space-y-2.5"
            >
              <span
                aria-hidden
                className="absolute -left-7 top-1.5 -translate-x-1/2"
              >
                <span className="block size-2.5 rounded-full bg-secondary-foreground/20 ring-4 ring-background" />
              </span>

              <Skeleton className="h-3.5 w-24 rounded bg-secondary/60" />
              <Skeleton className="h-5 w-44 rounded bg-secondary/80" />
              <Skeleton className="h-4 w-32 rounded bg-secondary/50" />
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
