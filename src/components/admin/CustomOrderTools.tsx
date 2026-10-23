"use client";

import { useState } from "react";
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

export function PrintFileButton({ custom, category, fileName }: { custom: Customization; category: Category; fileName: string }) {
  const [state, setState] = useState<{ busy?: boolean; error?: string; size?: string }>({});
  return (
    <div>
      <button
        type="button"
        className="btn"
        disabled={state.busy}
        onClick={async () => {
          setState({ busy: true });
          try {
            const { blob, W, H } = await renderPrintFile(custom, category);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            setState({ size: `${W} × ${H} px` });
          } catch (e) {
            setState({ error: (e as Error).message || "Couldn't build the print file." });
          }
        }}
      >
        {state.busy ? "Building print file…" : "Download print file (PNG)"}
      </button>
      {state.size && <p className="mt-1.5 text-sm opacity-70">Downloaded, {state.size}, transparent background.</p>}
      {state.error && (
        <p role="alert" className="mt-1.5 text-sm font-semibold text-gum-deep">
          {state.error}
        </p>
      )}
    </div>
  );
}
