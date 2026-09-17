import { NextResponse } from "next/server";
import { getNowPlaying } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasEnv =
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.SPOTIFY_REFRESH_TOKEN;

  if (hasEnv) {
    try {
      const data = await getNowPlaying();
      return NextResponse.json(data, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (e) {
      console.error("Spotify API error:", e);
      return NextResponse.json({ isPlaying: false }, {
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  // Fallback demo for preview when Spotify credentials are not configured yet
  return NextResponse.json({
    isPlaying: true,
    title: "Starboy",
    artist: "The Weeknd, Daft Punk",
    album: "Starboy",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452",
    songUrl: "https://open.spotify.com/track/7MXVkk9YM5IZxh0WSlE69q",
    durationMs: 230453,
    progressMs: 72000,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
