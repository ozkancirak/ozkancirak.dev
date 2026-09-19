import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { posts, type Post } from "@/lib/content";

function WritingRowSkeleton({ delay }: { delay: number }) {
  return (
    <Reveal delay={delay} as="div" className="py-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-2/5 rounded bg-secondary/80" />
        <Skeleton className="h-3.5 w-16 rounded bg-secondary/50" />
      </div>
      <Skeleton className="mt-2.5 h-3.5 w-4/5 rounded bg-secondary/60" />
      <Skeleton className="mt-2 h-3.5 w-3/5 rounded bg-secondary/40" />
    </Reveal>
  );
}

function WritingRow({ post, delay }: { post: Post; delay: number }) {
  return (
    <Reveal delay={delay} as="div" className="py-5">
      <Link
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-semibold text-foreground transition-colors group-hover:text-foreground">
            {post.title}
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground">
            {post.date}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {post.description}
        </p>
        <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground/70">
          {post.platform && <span>{post.platform}</span>}
          {post.readTime && (
            <>
              <span>·</span>
              <span>{post.readTime}</span>
            </>
          )}
          <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </Link>
    </Reveal>
  );
}

export function Writing() {
  const featured = posts.filter((p) => p.featured);
  const displayPosts = featured.length > 0 ? featured : posts.slice(0, 2);

  return (
    <section className="pt-20 sm:pt-28">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Writing</h2>
        <p className="mt-2 text-muted-foreground">
          Articles, notes, and thoughts on software engineering.
        </p>
      </Reveal>

      <div className="mt-6 divide-y divide-dashed divide-border">
        {displayPosts.length > 0 ? (
          displayPosts.map((post, i) => (
            <WritingRow key={post.slug} post={post} delay={i * 0.08} />
          ))
        ) : (
          <>
            <WritingRowSkeleton delay={0.08} />
            <WritingRowSkeleton delay={0.16} />
          </>
        )}
      </div>

      <Reveal delay={0.16}>
        <Link
          href="/writing"
          className="group mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all articles
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Reveal>
    </section>
  );
}
