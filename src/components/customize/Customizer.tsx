"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { CaseMockup } from "@/components/art/CaseMockup";
import { ToteMockup } from "@/components/art/ToteMockup";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { PRICING } from "@/config/pricing";
import {
  CUSTOM_TEXT,
  MAX_LAYERS,
  PLAIN_BASES,
  TEXT_COLORS,
  TEXT_STYLES,
  UPLOAD,
  type TextColorId,
} from "@/config/customization";
import { PHONE_MODEL_SUGGESTIONS } from "@/config/catalog";
import { CUSTOM_BASES } from "@/lib/catalog";
import { describePlacement, layerTitle } from "@/lib/describe";
import { formatPrice } from "@/lib/format";
import { prepareUpload, UploadError } from "@/lib/image";
import { clamp, LIMITS, newImageLayer, newTextLayer, normalizeAngle } from "@/lib/layers";
import type { Category, Customization, DesignLayer } from "@/lib/types";
import { uploadFile } from "@/lib/upload";
import { DesignCanvas, GEOMETRY } from "./DesignCanvas";

/** Stores the customer's full-quality file and returns its id. */
async function uploadOriginal(file: File): Promise<string> {
  try {
    return await uploadFile("design", file);
  } catch (err) {
    throw new UploadError((err as Error).message);
  }
}

function initialState(params: URLSearchParams) {
  const category: Category = params.get("product") === "case" ? "case" : "tote";
  const rawText = (params.get("text") ?? "").slice(0, CUSTOM_TEXT.maxLength).trim();
  const color = params.get("color");
  const textColor = TEXT_COLORS.some((c) => c.id === color) ? (color as TextColorId) : "grape";
  const layers: DesignLayer[] =
    rawText && CUSTOM_TEXT.allowedPattern.test(rawText) ? [newTextLayer(rawText, { color: textColor })] : [];
  return { category, baseId: PLAIN_BASES[category][0].id, layers };
}

export function Customizer() {
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const [initial] = useState(() => initialState(new URLSearchParams(params.toString())));
  const [category, setCategory] = useState<Category>(initial.category);
  const [baseId, setBaseId] = useState(initial.baseId);
  const [layers, setLayers] = useState<DesignLayer[]>(initial.layers);
  const [selectedId, setSelectedId] = useState<string | null>(initial.layers[0]?.id ?? null);
  const [newText, setNewText] = useState("");
  const [model, setModel] = useState("");
  const [qty, setQty] = useState(1);
  const [hint, setHint] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const custom: Customization = { baseId, layers };
  const product = CUSTOM_BASES[category];
  const unit = PRICING.customizationFee == null ? null : product.price + PRICING.customizationFee;
  const selected = layers.find((l) => l.id === selectedId) ?? null;
  const full = layers.length >= MAX_LAYERS;
  const area = GEOMETRY[category].area;

  const update = (id: string, patch: Partial<DesignLayer>) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? ({ ...l, ...patch } as DesignLayer) : l)));
  const remove = (id: string) => {
    setLayers((ls) => ls.filter((l) => l.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  };
  const move = (id: string, dir: 1 | -1) =>
    setLayers((ls) => {
      const i = ls.findIndex((l) => l.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ls.length) return ls;
      const next = [...ls];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const switchCategory = (c: Category) => {
    if (c === category) return;
    setCategory(c);
    setBaseId(PLAIN_BASES[c][0].id);
    setModel("");
  };

  const addFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (full) {
      setUploadError(`You can use up to ${MAX_LAYERS} layers. Remove one to add another.`);
      return;
    }
    setUploading(true);
    try {
      // A light preview for the screen, and the original file sent to us for printing
      const [img, fileId] = await Promise.all([prepareUpload(file), uploadOriginal(file)]);
      const layer = { ...newImageLayer(img, area.h / area.w), fileId };
      setLayers((ls) => [...ls, layer]);
      setSelectedId(layer.id);
      setHint(null);
    } catch (err) {
      setUploadError(err instanceof UploadError ? err.message : "Something went wrong reading that file. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addText = () => {
    const t = newText.trim();
    if (!t || full) return;
    const layer = newTextLayer(t, { y: layers.length ? 0.8 : 0.5 });
    setLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
    setNewText("");
    setHint(null);
  };

  const reset = () => {
    setLayers([]);
    setSelectedId(null);
    setBaseId(PLAIN_BASES[category][0].id);
    setModel("");
    setQty(1);
    setUploadError(null);
    setHint(null);
  };

  const canAdd = layers.length > 0 && (category === "tote" || !!model);
  const blockReason = !layers.length
    ? "Upload a design or add some text first."
    : category === "case" && !model
      ? "Pick your phone model first."
      : null;

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] gap-8 px-5 pb-16 md:px-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
      {/* Canvas */}
      <div className="sticky top-0 z-20 -mx-5 bg-milk/95 px-5 pt-3 pb-3 backdrop-blur-sm lg:top-24 lg:mx-0 lg:self-start lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="relative grid h-[44svh] min-h-[280px] place-items-center rounded-[32px] bg-[#FFD1E4] py-8 lg:h-[min(76vh,720px)] lg:rounded-[40px] lg:py-12">
          <span aria-hidden className="pointer-events-none absolute aspect-square h-[78%] rounded-full bg-white/35" />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={category}
              initial={reduce ? false : { y: 60, rotate: category === "tote" ? -8 : 8, opacity: 0 }}
              animate={{ y: 0, rotate: 0, opacity: 1 }}
              exit={reduce ? undefined : { y: -60, opacity: 0, transition: { duration: 0.16 } }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative h-full"
            >
              <DesignCanvas
                category={category}
                custom={custom}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onUpdate={update}
                onRemove={remove}
                title={`Preview of your ${category === "tote" ? "tote" : "case"} with ${layers.length} ${layers.length === 1 ? "layer" : "layers"}`}
              />
            </motion.div>
          </AnimatePresence>
          {layers.length === 0 && (
            <p className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center font-display text-2xl text-grape/70 lg:text-3xl">
              Upload your design or add text to start
            </p>
          )}
        </div>
        <p className="mt-2 text-center text-xs font-medium opacity-70 lg:text-sm">
          Drag to move. Corner knob resizes, top knob rotates. The dashed line is the print area.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-9">
        <Step title="What are we making?">
          <div className="grid grid-cols-2 gap-3">
            {(["tote", "case"] as const).map((c) => (
              <label key={c} className="cursor-pointer">
                <input type="radio" name="category" className="peer sr-only" checked={category === c} onChange={() => switchCategory(c)} />
                <span className="flex h-full items-center gap-3 rounded-[24px] p-3 ring-2 ring-grape/15 transition-all duration-300 ease-[var(--ease-gum)] peer-checked:bg-grape peer-checked:text-milk peer-checked:ring-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape hover:ring-grape/40">
                  <span className="grid h-16 w-12 shrink-0 place-items-center">
                    {c === "tote" ? (
                      <ToteMockup color={PLAIN_BASES.tote[0].color} className="h-full w-auto" />
                    ) : (
                      <CaseMockup color={PLAIN_BASES.case[0].color} className="h-full w-auto" />
                    )}
                  </span>
                  <span className="font-semibold">{c === "tote" ? "Tote bag" : "Phone case"}</span>
                </span>
              </label>
            ))}
          </div>
        </Step>

        <Step title="Product color">
          <div className="flex flex-wrap gap-3">
            {PLAIN_BASES[category].map((b) => (
              <label key={b.id} className="cursor-pointer text-center">
                <input type="radio" name="base" className="peer sr-only" checked={baseId === b.id} onChange={() => setBaseId(b.id)} />
                <span
                  className="mx-auto block size-12 rounded-full ring-2 ring-grape/20 transition-transform duration-300 ease-[var(--ease-gum)] peer-checked:scale-110 peer-checked:ring-4 peer-checked:ring-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape"
                  style={{ background: b.color }}
                />
                <span className="mt-1.5 block text-sm font-medium">{b.label}</span>
              </label>
            ))}
          </div>
        </Step>

        <Step title="Your design">
          {/* Upload */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFile(e.dataTransfer.files[0]);
            }}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-[28px] border-2 border-dashed px-5 py-7 text-center transition-colors focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-grape ${
              dragOver ? "border-gum bg-gum/10" : "border-grape/30 bg-white hover:border-grape/60"
            } ${full ? "pointer-events-none opacity-50" : ""}`}
          >
            <input
              ref={fileRef}
              type="file"
              accept={UPLOAD.accept.join(",")}
              className="sr-only"
              disabled={full || uploading}
              onChange={(e) => addFile(e.target.files?.[0])}
              aria-describedby="upload-help"
            />
            <svg viewBox="0 0 24 24" className="size-9 text-gum" aria-hidden>
              <path d="M12 16V4m0 0-5 5m5-5 5 5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-2xl">{uploading ? "Reading your file…" : "Upload your design"}</span>
            <span id="upload-help" className="text-sm opacity-75">
              Drop a file here or tap to choose. {UPLOAD.acceptLabel}, up to {UPLOAD.maxFileMb} MB.
            </span>
          </label>
          {uploadError && (
            <p role="alert" className="mt-2 font-semibold text-gum-deep">
              {uploadError}
            </p>
          )}

          {/* Add text */}
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addText();
            }}
          >
            <label htmlFor="new-text" className="sr-only">
              Text to add
            </label>
            <input
              id="new-text"
              value={newText}
              maxLength={CUSTOM_TEXT.maxLength}
              onChange={(e) => CUSTOM_TEXT.allowedPattern.test(e.target.value) && setNewText(e.target.value)}
              placeholder="Add text: a word, a date, a slogan…"
              autoComplete="off"
              disabled={full}
              className="h-13 min-w-0 flex-1 rounded-2xl border-2 border-grape/20 bg-white px-4 text-lg font-semibold outline-none focus:border-grape"
            />
            <button type="submit" className="btn shrink-0" disabled={!newText.trim() || full}>
              Add text
            </button>
          </form>
          <p className="mt-2 text-sm opacity-70">
            {layers.length} of {MAX_LAYERS} layers used.
          </p>

          {/* Layers */}
          {layers.length > 0 && (
            <ul aria-label="Layers, top first" className="mt-4 grid gap-2">
              {[...layers].reverse().map((l, idx) => {
                const isSel = l.id === selectedId;
                const topIndex = layers.length - 1 - idx;
                return (
                  <li key={l.id} className={`flex items-center gap-2 rounded-2xl p-2 ring-2 transition-colors ${isSel ? "bg-grape text-milk ring-grape" : "bg-white ring-grape/10"}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(l.id)}
                      aria-pressed={isSel}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left"
                    >
                      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:12px_12px] text-grape">
                        {l.kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
                          <img src={l.src} alt="" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="font-display text-lg">Aa</span>
                        )}
                      </span>
                      <span className="min-w-0 truncate font-semibold">{l.kind === "image" ? l.name : `“${l.text}”`}</span>
                    </button>
                    <IconButton label={`Move ${layerTitle(l)} up`} onClick={() => move(l.id, 1)} disabled={topIndex === layers.length - 1}>
                      <path d="M12 19V5m-6 6 6-6 6 6" />
                    </IconButton>
                    <IconButton label={`Move ${layerTitle(l)} down`} onClick={() => move(l.id, -1)} disabled={topIndex === 0}>
                      <path d="M12 5v14m-6-6 6 6 6-6" />
                    </IconButton>
                    <IconButton label={`Remove ${layerTitle(l)}`} onClick={() => remove(l.id)}>
                      <path d="M6 6l12 12M18 6 6 18" />
                    </IconButton>
                  </li>
                );
              })}
            </ul>
          )}
        </Step>

        {/* Selected layer */}
        <AnimatePresence initial={false}>
          {selected && (
            <motion.section
              key="adjust"
              aria-labelledby="adjust-title"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: 12, transition: { duration: 0.15 } }}
              className="rounded-[28px] bg-white p-5 ring-2 ring-grape/10"
            >
              <h2 id="adjust-title" className="font-display text-2xl leading-tight">
                Adjust {selected.kind === "image" ? "image" : "text"}
              </h2>

              {selected.kind === "text" && (
                <div className="mt-4 grid gap-4">
                  <div>
                    <label htmlFor="edit-text" className="font-semibold">
                      Text
                    </label>
                    <input
                      id="edit-text"
                      value={selected.text}
                      maxLength={CUSTOM_TEXT.maxLength}
                      onChange={(e) => CUSTOM_TEXT.allowedPattern.test(e.target.value) && update(selected.id, { text: e.target.value })}
                      onBlur={() => !selected.text.trim() && remove(selected.id)}
                      className="mt-1.5 h-12 w-full rounded-2xl border-2 border-grape/20 bg-milk px-4 text-lg font-semibold outline-none focus:border-grape"
                    />
                  </div>
                  <fieldset>
                    <legend className="mb-2 font-semibold">Style</legend>
                    <div className="flex rounded-full bg-milk p-1 ring-2 ring-grape/15">
                      {TEXT_STYLES.map((s) => (
                        <label key={s.id} className="flex-1 cursor-pointer">
                          <input type="radio" name="text-style" className="peer sr-only" checked={selected.style === s.id} onChange={() => update(selected.id, { style: s.id })} />
                          <span
                            className={`flex h-11 items-center justify-center rounded-full px-2 transition-colors peer-checked:bg-grape peer-checked:text-milk peer-focus-visible:outline-3 peer-focus-visible:outline-grape ${s.id === "clean" ? "font-bold" : "font-display"}`}
                            style={s.id === "outline" ? { WebkitTextStroke: "1.2px currentColor", WebkitTextFillColor: "transparent" } : undefined}
                          >
                            {s.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend className="mb-2 font-semibold">Color</legend>
                    <div className="flex flex-wrap gap-3">
                      {TEXT_COLORS.map((c) => (
                        <label key={c.id} className="cursor-pointer">
                          <input type="radio" name="text-color" className="peer sr-only" checked={selected.color === c.id} onChange={() => update(selected.id, { color: c.id })} />
                          <span
                            className="block size-10 rounded-full ring-2 ring-grape/20 transition-transform duration-300 ease-[var(--ease-gum)] peer-checked:scale-110 peer-checked:ring-4 peer-checked:ring-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape"
                            style={{ background: c.hex }}
                          />
                          <span className="sr-only">{c.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              <div className="mt-5 grid gap-4">
                <Slider
                  label="Left to right"
                  value={Math.round(selected.x * 100)}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => update(selected.id, { x: v / 100 })}
                />
                <Slider
                  label="Top to bottom"
                  value={Math.round(selected.y * 100)}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => update(selected.id, { y: v / 100 })}
                />
                {selected.kind === "image" ? (
                  <Slider
                    label="Size"
                    value={Math.round(selected.width * 100)}
                    min={LIMITS.imageWidth[0] * 100}
                    max={LIMITS.imageWidth[1] * 100}
                    unit="% wide"
                    onChange={(v) => update(selected.id, { width: clamp(v / 100, ...LIMITS.imageWidth) })}
                  />
                ) : (
                  <Slider
                    label="Size"
                    value={Math.round(selected.size * 100)}
                    min={LIMITS.textSize[0] * 100}
                    max={LIMITS.textSize[1] * 100}
                    unit=""
                    onChange={(v) => update(selected.id, { size: clamp(v / 100, ...LIMITS.textSize) })}
                  />
                )}
                <Slider
                  label="Rotation"
                  value={Math.round(selected.rotation)}
                  min={-180}
                  max={180}
                  unit="°"
                  onChange={(v) => update(selected.id, { rotation: normalizeAngle(v) })}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn btn-ghost min-h-11 px-4 text-sm" onClick={() => update(selected.id, { x: 0.5 })}>
                  Center horizontally
                </button>
                <button type="button" className="btn btn-ghost min-h-11 px-4 text-sm" onClick={() => update(selected.id, { rotation: 0 })}>
                  Straighten
                </button>
                <button type="button" className="btn btn-ghost min-h-11 px-4 text-sm" onClick={() => remove(selected.id)}>
                  Remove
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {category === "case" && (
          <Step title="Phone model">
            <div className="flex flex-wrap gap-2">
              {PHONE_MODEL_SUGGESTIONS.map((m) => (
                <label key={m} className="cursor-pointer">
                  <input
                    type="radio"
                    name="custom-model"
                    className="peer sr-only"
                    checked={model === m}
                    onChange={() => {
                      setModel(m);
                      setHint(null);
                    }}
                  />
                  <span className="flex h-11 items-center rounded-full px-4 font-medium ring-2 ring-grape/15 transition-all peer-checked:bg-grape peer-checked:text-milk peer-checked:ring-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape hover:ring-grape/40">
                    {m}
                  </span>
                </label>
              ))}
            </div>
          </Step>
        )}

        {/* Summary */}
        <section aria-labelledby="summary-title" className="rounded-[32px] bg-white p-6 shadow-[8px_10px_0_0_var(--color-gum)] ring-2 ring-grape">
          <h2 id="summary-title" className="font-display text-3xl">
            Your {category === "tote" ? "tote" : "case"}
          </h2>
          <dl className="mt-4 grid gap-1.5">
            <Row k="Color" v={PLAIN_BASES[category].find((b) => b.id === baseId)?.label ?? ""} />
            {category === "case" && <Row k="Model" v={model || "Not chosen"} muted={!model} />}
          </dl>
          {layers.length === 0 ? (
            <p className="mt-3 opacity-60">No design yet.</p>
          ) : (
            <ol className="mt-4 grid gap-3">
              {layers.map((l, i) => (
                <li key={l.id} className="rounded-2xl bg-milk p-3">
                  <p className="font-semibold">
                    {i + 1}. {layerTitle(l)}
                  </p>
                  <dl className="mt-1 grid gap-0.5 text-sm">
                    {describePlacement(l, category).map((r) => (
                      <Row key={r.k} k={r.k} v={r.v} />
                    ))}
                  </dl>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-5 border-t-2 border-grape/10 pt-4">
            <div className="flex justify-between">
              <span>{category === "tote" ? "Plain tote" : "Plain case"}</span>
              <span className="tabular-nums">{formatPrice(product.price)}</span>
            </div>
            <div className="flex justify-between">
              <span>Printing your design</span>
              <span className="tabular-nums">{formatPrice(PRICING.customizationFee)}</span>
            </div>
            <div className="mt-2 flex justify-between text-xl font-bold">
              <span>Each</span>
              <span className="tabular-nums">{formatPrice(unit)}</span>
            </div>
            <p className="mt-2 text-sm leading-snug opacity-75">
              Your original file and its exact placement are sent to us with your order for printing.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} label="Quantity" />
            {canAdd ? (
              <AddToBagButton product={product} custom={custom} variant={model || undefined} quantity={qty} className="flex-1" />
            ) : (
              <button type="button" className="btn flex-1" onClick={() => setHint(blockReason)}>
                Add to bag <span className="wink-eye" aria-hidden />
              </button>
            )}
          </div>
          {hint && (
            <p role="alert" className="mt-2 font-semibold text-gum-deep">
              {hint}
            </p>
          )}
          <button type="button" onClick={reset} className="mt-3 min-h-11 font-semibold underline-offset-4 hover:underline">
            Start over
          </button>
        </section>
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display mb-4 text-[1.9rem] leading-none">{title}</h2>
      {children}
    </section>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3">
      <dt className="font-semibold">{k}</dt>
      <dd className={`min-w-0 break-words ${muted ? "opacity-60" : ""}`}>{v}</dd>
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-current/10 disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const id = `slider-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <output htmlFor={id} className="text-sm font-semibold tabular-nums opacity-75">
          {value}
          {unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-8 w-full cursor-pointer accent-[var(--color-grape)]"
      />
    </div>
  );
}
