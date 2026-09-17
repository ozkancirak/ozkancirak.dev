import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Chrome shared by the real pages. The 404 lives outside this group, so it
 * renders on a bare canvas.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* Soft fade so content dissolves into the background at the bottom
          edge of the viewport. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-24 bg-linear-to-t from-background to-transparent"
      />
    </>
  );
}
