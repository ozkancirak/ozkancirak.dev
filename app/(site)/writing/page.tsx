import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/container";
import { Reveal } from "@/components/motion/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { posts, type Post } from "@/lib/content";

export const metadata: Metadata = {
  title: "Writing",
  description: "Articles, technical notes, and essays on software engineering.",
  alternates: { canonical: "/writing" },
};

function PostRow({ post }: { post: Post }) {
  return (
    <article className="py-7 sm:py-8">
      <Link
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground transition-colors group-hover:text-foreground">
            {post.title}
          </h2>
          <span className="shrink-0 text-xs text-muted-foreground">
            {post.date}
          </span>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {post.description}
        </p>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/70">
          {post.platform && <span className="font-medium">{post.platform}</span>}
          {post.readTime && (
            <>
              <span>·</span>
              <span>{post.readTime}</span>
            </>
          )}
          <span className="inline-flex items-center gap-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100 ml-auto">
            Read article
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function WritingPage() {
  return (
    <Container className="py-12 sm:py-16">
      <Reveal>
        <h1 className="text-3xl font-bold tracking-tight">Writing</h1>
        <p className="mt-2 text-muted-foreground">
          Articles, notes, and technical writeups on software engineering and systems.
        </p>
      </Reveal>

      <div className="mt-6 divide-y divide-dashed divide-border">
        {posts.length > 0 ? (
          posts.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.06}>
              <PostRow post={post} />
            </Reveal>
          ))
        ) : (
          <div className="divide-y divide-dashed divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <Reveal key={i} delay={i * 0.08} as="div" className="py-7 sm:py-8">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-1/2 rounded bg-secondary/80" />
                  <Skeleton className="h-4 w-20 rounded bg-secondary/50" />
                </div>
                <Skeleton className="mt-3.5 h-4 w-4/5 rounded bg-secondary/60" />
                <Skeleton className="mt-2 h-4 w-3/5 rounded bg-secondary/40" />
                <Skeleton className="mt-4 h-3.5 w-24 rounded bg-secondary/30" />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
