import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { availability, experience } from "@/lib/content";

export function Experience() {
  return (
    <section className="pt-20 sm:pt-28">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Experience</h2>
      </Reveal>

      <div className="relative mt-6 pl-7">
        <span
          aria-hidden
          className="absolute left-0 top-2 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-border"
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

          {experience.map((exp, i) => (
            <Reveal
              as="li"
              key={exp.role + exp.company}
              delay={(i + 1) * 0.08}
              className="relative"
            >
              <span
                aria-hidden
                className="absolute -left-7 top-1.5 flex -translate-x-1/2"
              >
                <span className="block size-2.5 rounded-full bg-foreground ring-4 ring-background" />
              </span>

              <p className="text-sm text-muted-foreground">{exp.period}</p>
              <h3 className="mt-1 text-lg font-semibold">
                {exp.url ? (
                  <a
                    href={exp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  >
                    {exp.company}
                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
                  </a>
                ) : (
                  exp.company
                )}
              </h3>
              <p className="mt-0.5 text-muted-foreground">{exp.role}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
