import { NextResponse } from "next/server";

const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
// currently-playing is the scope the "now playing" bubble needs.
const SCOPES = ["user-read-currently-playing", "user-read-playback-state"].join(
  " "
);

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
  });

  return NextResponse.redirect(`${AUTH_ENDPOINT}?${params.toString()}`);
}
