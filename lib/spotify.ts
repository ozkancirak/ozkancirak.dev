// Spotify "now playing" via the Web API. Uses a long-lived refresh token
// (server-only) to mint short-lived access tokens on demand. Independent of
// any Discord/Lanyard presence.

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT =
  "https://api.spotify.com/v1/me/player/currently-playing";

export type NowPlaying = {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progressMs?: number;
  durationMs?: number;
};

function getEnv() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Spotify environment variables");
  }

  return { clientId, clientSecret, refreshToken };
}

async function getAccessToken() {
  const { clientId, clientSecret, refreshToken } = getEnv();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to refresh Spotify token");

  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

type SpotifyTrack = {
  is_playing: boolean;
  progress_ms: number | null;
  item: {
    name: string;
    duration_ms: number;
    artists: { name: string }[];
    album: { name: string; images: { url: string }[] };
    external_urls: { spotify: string };
  } | null;
};

export async function getNowPlaying(): Promise<NowPlaying> {
  const accessToken = await getAccessToken();

  const res = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  // 204 = nothing playing; anything else non-2xx = treat as not playing.
  if (res.status === 204 || !res.ok) {
    return { isPlaying: false };
  }

  const song = (await res.json()) as SpotifyTrack;
  if (!song.is_playing || !song.item) {
    return { isPlaying: false };
  }

  return {
    isPlaying: true,
    title: song.item.name,
    artist: song.item.artists.map((a) => a.name).join(", "),
    album: song.item.album.name,
    albumImageUrl: song.item.album.images[0]?.url,
    songUrl: song.item.external_urls.spotify,
    progressMs: song.progress_ms ?? 0,
    durationMs: song.item.duration_ms,
  };
}
