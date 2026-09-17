"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { SiSpotify } from "react-icons/si";
import { cn } from "@/lib/utils";
import type { NowPlaying as NowPlayingData } from "@/lib/spotify";

const POLL_MS = 30000;

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function EqualizerBars() {
  return (
    <span className="flex shrink-0 items-end gap-0.5" aria-hidden>
      <span className="h-2 w-0.5 origin-bottom animate-[spotify-bar_0.9s_ease-in-out_infinite] rounded-full bg-emerald-500 motion-reduce:animate-none" />
      <span className="h-3.5 w-0.5 origin-bottom animate-[spotify-bar_0.9s_ease-in-out_infinite_0.2s] rounded-full bg-emerald-500 motion-reduce:animate-none" />
      <span className="h-2.5 w-0.5 origin-bottom animate-[spotify-bar_0.9s_ease-in-out_infinite_0.4s] rounded-full bg-emerald-500 motion-reduce:animate-none" />
      <span className="h-1.5 w-0.5 origin-bottom animate-[spotify-bar_0.9s_ease-in-out_infinite_0.6s] rounded-full bg-emerald-500 motion-reduce:animate-none" />
    </span>
  );
}

export function NowPlaying() {
  const [track, setTrack] = useState<NowPlayingData>({ isPlaying: false });
  const [fetchedAt, setFetchedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();

  // Touch devices have no hover, so the card is opened by tapping instead.
  // Tapping anywhere else closes it again.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // First tap on a touch device reveals the details rather than jumping
    // straight to Spotify; a second tap follows the link.
    if (!open && window.matchMedia("(hover: none)").matches) {
      e.preventDefault();
      setOpen(true);
    }
  };

  // Poll the endpoint.
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/now-playing");
        const data = (await res.json()) as NowPlayingData;
        if (active) {
          setTrack(data);
          setFetchedAt(Date.now());
        }
      } catch {
        // keep last known state on transient errors
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Tick once a second so the progress bar advances between polls.
  useEffect(() => {
    if (!track.isPlaying) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [track.isPlaying]);

  if (!track.isPlaying) return null;

  const duration = track.durationMs ?? 0;
  const elapsed =
    duration > 0
      ? Math.min((track.progressMs ?? 0) + (now - fetchedAt), duration)
      : 0;
  const percent = duration > 0 ? (elapsed / duration) * 100 : 0;

  return (
    <motion.a
      ref={rootRef}
      href={track.songUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`Listening to ${track.title} by ${track.artist} on Spotify`}
      aria-expanded={open}
      className="absolute bottom-1/2 left-full z-20 mb-3 ml-3"
      style={{ transformOrigin: "bottom left" }}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.7, x: -6, y: 6 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 20 }}
    >
      {/* Thought-bubble tail: two dots trailing diagonally back to the avatar. */}
      <span
        aria-hidden
        className="absolute -bottom-1 -left-1 size-2 rounded-full border border-border bg-card shadow-sm"
      />
      <span
        aria-hidden
        className="absolute -bottom-3 -left-3 size-1.5 rounded-full border border-border bg-card shadow-sm"
      />

      {/* Collapsed bubble */}
      <motion.span
        whileHover={reduceMotion ? undefined : { y: -1 }}
        className="flex items-center gap-2 rounded-2xl border border-border bg-card/95 p-1.5 pr-3 shadow-lg backdrop-blur-sm"
      >
        {track.albumImageUrl ? (
          <span className="relative block size-7 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
            <Image
              src={track.albumImageUrl}
              alt=""
              fill
              className="object-cover"
            />
          </span>
        ) : (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <SiSpotify className="size-4 text-emerald-500" />
          </span>
        )}
        <EqualizerBars />
      </motion.span>

      {/* Expanded card: hover on pointer devices, tap-to-open on touch. On
          narrow screens it shifts left so it doesn't run off the edge. */}
      <span
        className={cn(
          "absolute top-full left-0 z-30 mt-2.5 block w-72 max-w-[calc(100vw-3rem)] origin-top-left transition duration-150 ease-out max-sm:-translate-x-24",
          "pointer-events-none group-hover:scale-100 group-hover:opacity-100",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "scale-95 opacity-0"
        )}
      >
        <span className="absolute -top-1 left-5 size-2.5 rotate-45 rounded-xs border-t border-l border-border bg-card max-sm:left-29" />
        <span className="block rounded-2xl border border-border bg-card p-3.5 text-left shadow-xl">
          <span className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-emerald-500">
            <SiSpotify className="size-3.5" />
            Listening to Spotify
          </span>

          <span className="flex gap-3">
            {track.albumImageUrl ? (
              <span className="relative block size-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
                <Image
                  src={track.albumImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              </span>
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                <SiSpotify className="size-6 text-emerald-500" />
              </span>
            )}

            <span className="flex min-w-0 flex-col justify-center">
              <span className="truncate text-sm font-semibold text-foreground">
                {track.title}
              </span>
              {track.artist && (
                <span className="truncate text-xs text-muted-foreground">
                  by {track.artist}
                </span>
              )}
              {track.album && (
                <span className="truncate text-xs text-muted-foreground">
                  on {track.album}
                </span>
              )}
            </span>
          </span>

          {duration > 0 && (
            <span className="mt-3.5 block">
              <span className="block h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                <span
                  className="block h-full rounded-full bg-emerald-500"
                  style={{ width: `${percent}%` }}
                />
              </span>
              <span className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                <span>{formatTime(elapsed)}</span>
                <span>{formatTime(duration)}</span>
              </span>
            </span>
          )}
        </span>
      </span>
    </motion.a>
  );
}
