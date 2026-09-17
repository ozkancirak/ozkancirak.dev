import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon: the green eye, on a transparent background. */
export default function Icon() {
  const svg = readFileSync(
    join(process.cwd(), "public/green-eye-accent.svg"),
    "utf8"
  );
  const eye = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={eye} width={64} height={61} alt="" />
      </div>
    ),
    size
  );
}
