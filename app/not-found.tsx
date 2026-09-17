import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/container";
import { Reveal } from "@/components/motion/reveal";

export default function NotFound() {
  return (
    // No header or footer here — the 404 sits on a bare, vertically centred canvas.
    <main className="flex flex-1 items-center py-24">
      <Container>
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Error · 404
          </p>

          <h1 className="mt-5 text-6xl font-bold tracking-tight sm:text-7xl">
            This page never shipped.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            It doesn&apos;t exist, it moved, or it never made it out of my
            drafts.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 font-semibold text-foreground underline decoration-border decoration-2 underline-offset-4 transition-colors hover:decoration-foreground"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              Back to home
            </Link>

            <span aria-hidden className="text-muted-foreground">
              ·
            </span>

            <Link
              href="/projects"
              className="group inline-flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Projects
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </Container>
    </main>
  );
}
