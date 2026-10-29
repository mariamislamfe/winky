"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { CaseMockup, CASE_PRINT } from "@/components/art/CaseMockup";
import { textHex } from "@/components/art/CustomOverlay";
import { ToteMockup, TOTE_PRINT } from "@/components/art/ToteMockup";
import { PRINT_AREA_CM } from "@/config/customization";
import { PRINT_DPI, PRINT_FILE_DEFAULT_WIDTH_PX } from "@/config/orders";
import { colorForBase } from "@/lib/catalog";
import type { Category, Customization } from "@/lib/types";

const AREA = { tote: TOTE_PRINT, case: CASE_PRINT } as const;

/** The customer's design drawn on the product, as they saw it. */
export function OrderMockup({ custom, category, className }: { custom: Customization; category: Category; className?: string }) {
  const color = colorForBase(custom.baseId, category);
  return category === "tote" ? (
    <ToteMockup color={color} custom={custom} title="Customer's design on the tote" className={className} />
  ) : (
    <CaseMockup color={color} custom={custom} title="Customer's design on the case" className={className} />
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${src}`));
    img.src = src;
  });
}

const FONT_VAR = { bubble: "--font-bagel", outline: "--font-bagel", clean: "--font-instrument" } as const;

/**
 * Builds a print-ready transparent PNG of the print area: every image and
 * text layer at its exact position, size and rotation, using the original
 * uploaded files. 300 DPI once PRINT_AREA_CM is set, otherwise 3000 px wide.
 */
async function renderPrintFile(custom: Customization, category: Category) {
  const area = AREA[category];
  const cm = PRINT_AREA_CM[category];
  const W = cm ? Math.round((cm.width / 2.54) * PRINT_DPI) : PRINT_FILE_DEFAULT_WIDTH_PX;
  const H = Math.round((W * area.h) / area.w);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const root = getComputedStyle(document.documentElement);

  for (const layer of custom.layers) {
    ctx.save();
    ctx.translate(layer.x * W, layer.y * H);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    if (layer.kind === "image") {
      const img = await loadImage(layer.src);
      const w = layer.width * W;
      const h = w * layer.aspect;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      const family = root.getPropertyValue(FONT_VAR[layer.style]).trim() || "sans-serif";
      const size = layer.size * W;
      const weight = layer.style === "clean" ? 700 : 400;
      const font = `${weight} ${size}px ${family}`;
      await document.fonts.load(font, layer.text);
      ctx.font = font;
      if (layer.style === "clean" && "fontStretch" in ctx) (ctx as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = "semi-condensed";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const color = textHex(layer.color);
      if (layer.style === "outline") {
        ctx.lineJoin = "round";
        ctx.lineWidth = Math.max((1.5 * W) / area.w, size * 0.06);
        ctx.strokeStyle = color;
        ctx.strokeText(layer.text, 0, 0);
      } else {
        ctx.fillStyle = color;
        ctx.fillText(layer.text, 0, 0);
      }
    }
    ctx.restore();
  }
  return new Promise<{ blob: Blob; W: number; H: number }>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve({ blob: b, W, H }) : reject(new Error("Export failed"))), "image/png"),
  );
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Couldn't read the print file."));
    r.readAsDataURL(blob);
  });

const MOCKUP_WIDTH_PX = 1600;

/**
 * The mockup as a PNG: the product drawing with the finished print file laid
 * over its print area (so fonts and originals match the print exactly).
 */
async function renderMockupFile(custom: Customization, category: Category, print: { blob: Blob; W: number; H: number }) {
  const flat: Customization = {
    baseId: custom.baseId,
    layers: [
      {
        kind: "image",
        id: "print",
        src: await blobToDataUrl(print.blob),
        name: "print",
        aspect: print.H / print.W,
        originalWidth: print.W,
        originalHeight: print.H,
        width: 1,
        x: 0.5,
        y: 0.5,
        rotation: 0,
      },
    ],
  };
  const host = document.createElement("div");
  const root = createRoot(host);
  flushSync(() => root.render(<OrderMockup custom={flat} category={category} />));
  const svg = host.querySelector("svg")!;
  const [, , vw, vh] = svg.getAttribute("viewBox")!.split(" ").map(Number);
  const W = MOCKUP_WIDTH_PX;
  const H = Math.round((W * vh) / vw);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(W));
  svg.setAttribute("height", String(H));
  const markup = new XMLSerializer().serializeToString(svg);
  root.unmount();

  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    // white, not transparent: photo galleries show transparency as black
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

const CHECKER =
  "bg-white bg-[length:20px_20px] bg-[position:0_0,10px_10px] bg-[image:linear-gradient(45deg,rgb(43_17_64/0.07)_25%,transparent_25%,transparent_75%,rgb(43_17_64/0.07)_75%),linear-gradient(45deg,rgb(43_17_64/0.07)_25%,transparent_25%,transparent_75%,rgb(43_17_64/0.07)_75%)]";

/**
 * A custom item's two pictures side by side: the design on the product (as
 * the customer saw it) and the design on its own (the print file), each with
 * a download.
 */
export function DesignFiles({ custom, category, fileName }: { custom: Customization; category: Category; fileName: string }) {
  const [print, setPrint] = useState<{ blob: Blob; W: number; H: number; url: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const product = category === "tote" ? "tote" : "case";

  useEffect(() => {
    let url = "";
    let live = true;
    renderPrintFile(custom, category)
      .then((p) => {
        url = URL.createObjectURL(p.blob);
        if (live) setPrint({ ...p, url });
        else URL.revokeObjectURL(url);
      })
      .catch((e) => live && setError((e as Error).message || "Couldn't build the print file."));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [custom, category]);

  const panel = "grid grid-rows-[auto_1fr_auto] gap-3 rounded-2xl bg-milk p-4";
  const button = "min-h-11 rounded-full bg-grape px-4 text-sm font-bold text-milk disabled:opacity-50";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <figure className={panel}>
        <figcaption className="font-semibold">On the {product}</figcaption>
        <div className="grid place-items-center">
          <OrderMockup custom={custom} category={category} className="h-72 w-auto" />
        </div>
        <button
          type="button"
          className={button}
          disabled={!print || busy}
          onClick={async () => {
            if (!print) return;
            setBusy(true);
            setError("");
            try {
              download(await renderMockupFile(custom, category, print), fileName.replace(/\.png$/, "-mockup.png"));
            } catch (e) {
              setError((e as Error).message || "Couldn't build the mockup.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Building mockup…" : "Download mockup (PNG)"}
        </button>
      </figure>

      <figure className={panel}>
        <figcaption className="font-semibold">Design only (print file)</figcaption>
        <div className="flex h-72 items-center justify-center">
          {print ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated in the browser
            <img
              src={print.url}
              alt={`The customer's design on its own, ${print.W} × ${print.H} px`}
              className={`max-h-full max-w-full rounded-lg ring-2 ring-grape/10 ${CHECKER}`}
            />
          ) : (
            !error && <p className="text-sm opacity-60">Building the design…</p>
          )}
        </div>
        <button type="button" className={button} disabled={!print} onClick={() => print && download(print.blob, fileName)}>
          Download print file (PNG)
        </button>
      </figure>

      {print && (
        <p className="text-sm opacity-70 sm:col-span-2">
          The print file is the whole print area ({print.W} × {print.H} px, transparent background) with every layer exactly where
          the customer placed it. Upload it on Zink as the design for this product.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-gum-deep sm:col-span-2">
          {error}
        </p>
      )}
    </div>
  );
}
