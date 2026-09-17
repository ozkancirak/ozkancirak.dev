import { Reveal } from "@/components/motion/reveal";
import { Skeleton } from "@/components/ui/skeleton";

export function Stack() {
  return (
    <section className="pt-20 sm:pt-28">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">My stack</h2>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
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

