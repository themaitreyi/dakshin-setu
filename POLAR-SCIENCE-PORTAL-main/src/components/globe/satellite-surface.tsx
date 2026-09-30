import { useEffect, useRef, useState } from "react";

// Inverse orthographic projection: the texture and SVG station markers use
// the same geographic camera, so dragging never detaches pins from the land.
export function SatelliteSurface({
  longitude,
  latitude,
  clouds,
}: {
  longitude: number;
  latitude: number;
  clouds: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [textures, setTextures] = useState<ImageData[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const read = (url: string) =>
      new Promise<ImageData>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const buffer = document.createElement("canvas");
          buffer.width = img.width;
          buffer.height = img.height;
          const ctx = buffer.getContext("2d");
          if (!ctx) return reject(new Error("Canvas unavailable"));
          ctx.drawImage(img, 0, 0);
          resolve(ctx.getImageData(0, 0, img.width, img.height));
        };
        img.onerror = reject;
        img.src = url;
      });
    Promise.all([read("/textures/earth.jpg"), read("/textures/clouds.png")])
      .then((items) => {
        if (!cancelled) setTextures(items);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || !textures) return;
    const earth = textures[0]!;
    const cloud = textures[1]!;
    const size = 420;
    const radius = (size * 148) / 340;
    const output = ctx.createImageData(size, size);
    const lat0 = (latitude * Math.PI) / 180;
    const lon0 = (longitude * Math.PI) / 180;
    const sin0 = Math.sin(lat0);
    const cos0 = Math.cos(lat0);
    for (let py = 0; py < size; py++) {
      const y = (size / 2 - py) / radius;
      for (let px = 0; px < size; px++) {
        const x = (px - size / 2) / radius;
        const r2 = x * x + y * y;
        if (r2 > 1) continue;
        const z = Math.sqrt(1 - r2);
        const lat = Math.asin(y * cos0 + z * sin0);
        const lon = lon0 + Math.atan2(x, z * cos0 - y * sin0);
        const u = (((lon / (2 * Math.PI) + 0.5) % 1) + 1) % 1;
        const v = Math.min(0.999999, Math.max(0, 0.5 - lat / Math.PI));
        const index =
          (Math.floor(v * earth.height) * earth.width + Math.floor(u * earth.width)) * 4;
        const ci = (Math.floor(v * cloud.height) * cloud.width + Math.floor(u * cloud.width)) * 4;
        const alpha = clouds ? (cloud.data[ci]! / 255) * 0.8 : 0;
        const shade = 0.48 + 0.52 * Math.max(0, -0.25 * x + 0.3 * y + 0.92 * z);
        const rim = Math.pow(1 - z, 4) * 0.35;
        const oi = (py * size + px) * 4;
        for (let c = 0; c < 3; c++) {
          const colour = earth.data[index + c]! * (1 - alpha) + 245 * alpha;
          output.data[oi + c] = colour * shade * (1 - rim) + [80, 185, 240][c]! * rim;
        }
        output.data[oi + 3] = Math.min(255, (1 - Math.sqrt(r2)) * radius * 255);
      }
    }
    ctx.putImageData(output, 0, 0);
  }, [longitude, latitude, clouds, textures]);

  return (
    <div className="relative size-full">
      <canvas ref={canvas} width={420} height={420} className="size-full" aria-hidden />
      {!textures && (
        <span className="absolute inset-x-6 top-1/2 text-center text-xs text-slate-600">
          {failed
            ? "Imagery unavailable. Station map remains available."
            : "Loading Earth imagery…"}
        </span>
      )}
    </div>
  );
}
