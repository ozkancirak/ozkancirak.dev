import { ContributionGraph } from "@/components/contribution-graph";
import { Reveal } from "@/components/motion/reveal";

export function Activity() {
  return (
    <section className="pt-20 pb-20 sm:pt-28 sm:pb-28">
      <Reveal>
        <ContributionGraph />
      </Reveal>
    </section>
  );
}
