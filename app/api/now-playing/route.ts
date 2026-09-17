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

  // Not playing anything by default until actively connected
  return NextResponse.json(
    { isPlaying: false },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
