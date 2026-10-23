"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { CASE_PRINT, CASE_VIEWBOX, CaseMockup } from "@/components/art/CaseMockup";
import { TEXT_FONT } from "@/components/art/CustomOverlay";
import { TOTE_PRINT, TOTE_VIEWBOX, ToteMockup } from "@/components/art/ToteMockup";
import { colorForBase } from "@/lib/catalog";
import { layerTitle } from "@/lib/describe";
import { clamp, LIMITS, normalizeAngle } from "@/lib/layers";
import type { Category, Customization, DesignLayer } from "@/lib/types";

export const GEOMETRY = {
  tote: { box: TOTE_VIEWBOX, area: { ...TOTE_PRINT, rx: 0 } },
  case: { box: CASE_VIEWBOX, area: CASE_PRINT },
} as const;

type Props = {
  category: Category;
  custom: Customization;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<DesignLayer>) => void;
  onRemove: (id: string) => void;
  title: string;
};

/** Run a pointer gesture until release, with window-level listeners. */
function gesture(e: ReactPointerEvent, onMove: (ev: PointerEvent) => void, onEnd?: () => void) {
  e.preventDefault();
  e.stopPropagation();
  const move = (ev: PointerEvent) => onMove(ev);
  const end = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    onEnd?.();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
}

const SNAP = 0.02;

export function DesignCanvas({ category, custom, selectedId, onSelect, onUpdate, onRemove, title }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState({ v: false, h: false });
  const { box, area } = GEOMETRY[category];
  const color = colorForBase(custom.baseId, category);

  const rect = () => areaRef.current!.getBoundingClientRect();

  const startMove = (e: ReactPointerEvent<HTMLDivElement>, layer: DesignLayer) => {
    onSelect(layer.id);
    e.currentTarget.focus({ preventScroll: true });
    const r = rect();
    const sx = e.clientX;
    const sy = e.clientY;
    gesture(
      e,
      (ev) => {
        let x = layer.x + (ev.clientX - sx) / r.width;
        let y = layer.y + (ev.clientY - sy) / r.height;
        const v = Math.abs(x - 0.5) < SNAP;
        const h = Math.abs(y - 0.5) < SNAP;
        if (v) x = 0.5;
        if (h) y = 0.5;
        setGuides({ v, h });
        onUpdate(layer.id, { x: clamp(x, 0, 1), y: clamp(y, 0, 1) });
      },
      () => setGuides({ v: false, h: false }),
    );
  };

  const centerOf = (layer: DesignLayer) => {
    const r = rect();
    return { cx: r.left + layer.x * r.width, cy: r.top + layer.y * r.height };
  };

  const startResize = (e: ReactPointerEvent, layer: DesignLayer) => {
    const { cx, cy } = centerOf(layer);
    const d0 = Math.max(8, Math.hypot(e.clientX - cx, e.clientY - cy));
    const s0 = layer.kind === "image" ? layer.width : layer.size;
    gesture(e, (ev) => {
      const f = Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0;
      if (layer.kind === "image") onUpdate(layer.id, { width: clamp(s0 * f, ...LIMITS.imageWidth) });
      else onUpdate(layer.id, { size: clamp(s0 * f, ...LIMITS.textSize) });
    });
  };

  const startRotate = (e: ReactPointerEvent, layer: DesignLayer) => {
    const { cx, cy } = centerOf(layer);
    gesture(e, (ev) => {
      let a = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
      if (ev.shiftKey) a = Math.round(a / 15) * 15;
      else {
        const near = Math.round(a / 45) * 45;
        if (Math.abs(a - near) < 4) a = near;
      }
      onUpdate(layer.id, { rotation: normalizeAngle(a) });
    });
  };

  const onKey = (e: KeyboardEvent, layer: DesignLayer) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const grow = (f: number) =>
      layer.kind === "image"
        ? onUpdate(layer.id, { width: clamp(layer.width * f, ...LIMITS.imageWidth) })
        : onUpdate(layer.id, { size: clamp(layer.size * f, ...LIMITS.textSize) });
    const turn = e.shiftKey ? 15 : 5;
    const map: Record<string, () => void> = {
      ArrowLeft: () => onUpdate(layer.id, { x: clamp(layer.x - step, 0, 1) }),
      ArrowRight: () => onUpdate(layer.id, { x: clamp(layer.x + step, 0, 1) }),
      ArrowUp: () => onUpdate(layer.id, { y: clamp(layer.y - step, 0, 1) }),
      ArrowDown: () => onUpdate(layer.id, { y: clamp(layer.y + step, 0, 1) }),
      "+": () => grow(1.05),
      "=": () => grow(1.05),
      "-": () => grow(1 / 1.05),
      "[": () => onUpdate(layer.id, { rotation: normalizeAngle(layer.rotation - turn) }),
      "]": () => onUpdate(layer.id, { rotation: normalizeAngle(layer.rotation + turn) }),
      Delete: () => onRemove(layer.id),
      Backspace: () => onRemove(layer.id),
      Escape: () => onSelect(null),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const Mockup = category === "tote" ? ToteMockup : CaseMockup;
  const pctX = (v: number) => `${(v / box.w) * 100}%`;
  const pctY = (v: number) => `${(v / box.h) * 100}%`;

  return (
    <div className="relative h-full" style={{ aspectRatio: `${box.w} / ${box.h}` }}>
      <Mockup color={color} custom={custom} title={title} className="absolute inset-0 size-full drop-shadow-[12px_14px_0_rgb(43_17_64/0.18)]" />

      {/* Interaction layer, aligned to the print area */}
      <div
        ref={areaRef}
        className="absolute [container-type:inline-size]"
        style={{ left: pctX(area.x), top: pctY(area.y), width: pctX(area.w), height: pctY(area.h) }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onSelect(null);
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 border-2 border-dashed border-grape/30"
          style={{ borderRadius: area.rx ? `${(area.rx / area.w) * 100}% / ${(area.rx / area.h) * 100}%` : 6 }}
        />
        {guides.v && <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-gum" />}
        {guides.h && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-gum" />}

        {custom.layers.map((layer) => {
          const selected = layer.id === selectedId;
          const font = layer.kind === "text" ? TEXT_FONT[layer.style] : null;
          return (
            <div
              key={layer.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`${layerTitle(layer)}. Drag to move.`}
              aria-describedby="canvas-keys"
              onPointerDown={(e) => startMove(e, layer)}
              onFocus={() => onSelect(layer.id)}
              onKeyDown={(e) => onKey(e, layer)}
              className={`absolute cursor-move touch-none select-none outline-offset-4 focus-visible:shadow-none ${
                selected ? "z-10 outline-2 outline-cobalt" : "outline-1 outline-transparent hover:outline-grape/40"
              }`}
              style={{
                left: `${layer.x * 100}%`,
                top: `${layer.y * 100}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                ...(layer.kind === "image"
                  ? { width: `${layer.width * 100}%`, aspectRatio: `1 / ${layer.aspect}` }
                  : {
                      fontFamily: font!.family,
                      fontWeight: font!.weight,
                      fontVariationSettings: font!.variation,
                      fontSize: `${layer.size * 100}cqw`,
                      lineHeight: 1,
                      whiteSpace: "pre",
                      color: "transparent",
                    }),
                outlineStyle: selected ? "solid" : "dashed",
              }}
            >
              {layer.kind === "text" ? layer.text : null}
              {selected && (
                <>
                  {/* rotate knob */}
                  <span
                    aria-hidden
                    onPointerDown={(e) => startRotate(e, layer)}
                    className="absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 cursor-grab flex-col items-center"
                    style={{ fontSize: 16 }}
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-cobalt text-milk shadow-[0_2px_0_rgb(43_17_64/0.3)]">
                      <svg viewBox="0 0 24 24" className="size-4">
                        <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="h-4 w-0.5 bg-cobalt" />
                  </span>
                  {/* resize knob */}
                  <span
                    aria-hidden
                    onPointerDown={(e) => startResize(e, layer)}
                    className="absolute -right-4 -bottom-4 grid size-8 cursor-nwse-resize place-items-center rounded-full bg-cobalt text-milk shadow-[0_2px_0_rgb(43_17_64/0.3)]"
                    style={{ fontSize: 16 }}
                  >
                    <svg viewBox="0 0 24 24" className="size-4">
                      <path d="M7 17 17 7M11 7h6v6M13 17H7v-6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {/* remove */}
                  <button
                    type="button"
                    aria-label={`Remove ${layerTitle(layer)}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(layer.id);
                    }}
                    className="absolute -top-4 -right-4 grid size-8 place-items-center rounded-full bg-grape text-milk shadow-[0_2px_0_rgb(43_17_64/0.3)]"
                    style={{ fontSize: 16 }}
                  >
                    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <p id="canvas-keys" className="sr-only">
        Arrow keys move the layer, hold Shift for bigger steps. Plus and minus resize. Square brackets rotate. Delete removes it.
      </p>
    </div>
  );
}
