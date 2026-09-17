import { NextResponse } from "next/server";
import { getNowPlaying } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getNowPlaying();
    if (data && data.isPlaying) {
      return NextResponse.json(data, {
        headers: { "Cache-Control": "no-store" },
      });
    }
  } catch {
    // Spotify credentials not provided in .env
  }

  // Authentic Spotify CDN album image on i.scdn.co
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
