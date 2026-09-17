import { Reveal } from "@/components/motion/reveal";
import { NowPlaying } from "@/components/now-playing";
import { Highlighter } from "@/components/ui/highlighter";
import { Skeleton } from "@/components/ui/skeleton";
import { Socials } from "@/components/socials";
import { profile } from "@/lib/content";

export function Hero() {
  return (
    <section className="pt-12 sm:pt-24">
      <Reveal>
        {/* Non-clipping group wrapper so the now-playing bubble can extend past
            the avatar and reveal its card when the avatar is hovered. */}
        <div className="group relative inline-block">
          <Skeleton className="size-20 rounded-full ring-1 ring-border sm:size-24" />
          <NowPlaying />
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <h1 className="mt-7 text-4xl font-bold tracking-tight sm:mt-8 sm:text-5xl">
          {profile.greeting}
        </h1>
      </Reveal>

      <Reveal delay={0.16}>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          {profile.tagline.before}
          {/*
            rough-notation injects an absolutely-positioned SVG next to the
            annotated span. `relative` pins it to this wrapper — otherwise its
            containing block is Reveal's motion.div, which drops its transform
            when the animation ends, shifting the stroke off-screen.

            Also keep this subtree free of state: React would wipe the injected
            SVG on re-render, so the stroke takes its color from currentColor
            instead of a useTheme hook. That's why the wrapper carries
            text-foreground (it colors the stroke) while the text itself stays
            muted like the rest of the sentence.
          */}
          <span className="relative inline-block text-foreground">
            <Highlighter
              action="underline"
              color="currentColor"
              strokeWidth={2}
              iterations={2}
              padding={2}
              animationDuration={700}
            >
              <span className="text-black/75 dark:text-white/75">
                {profile.tagline.highlight}
              </span>
            </Highlighter>
          </span>
          {profile.tagline.after}
        </p>
      </Reveal>

      <Reveal delay={0.24}>
        <div className="mt-8 flex items-center gap-4">
          <a
            href={`mailto:${profile.email}`}
            className="font-semibold text-foreground underline decoration-border decoration-2 underline-offset-4 transition-colors hover:decoration-foreground"
          >
            {profile.email}
          </a>
          <span aria-hidden className="h-4 w-px bg-border" />
          <Socials />
        </div>
      </Reveal>
    </section>
  );
}
