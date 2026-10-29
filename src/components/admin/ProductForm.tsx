"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { addStageColor, removeStageColor, saveProduct, type SaveState } from "@/app/admin/actions";
import { CaseMockup } from "@/components/art/CaseMockup";
import { ToteMockup } from "@/components/art/ToteMockup";
import { CASE_DESCRIPTION, DEFAULT_STAGE, PHONE_MODELS, PRODUCT_IMAGE, STAGE_COLORS } from "@/config/catalog";
import { CASE_PRICE, PRICING } from "@/config/pricing";
import { SITE } from "@/config/site";
import { formatPrice } from "@/lib/format";
import { searchModels } from "@/lib/models";
import type { Category, Product, ProductImage } from "@/lib/types";
import { uploadFile } from "@/lib/upload";

type Upload = { id: string; name: string; error?: string };

export function ProductForm({ product, customColors = [] }: { product?: Product; customColors?: string[] }) {
  const [state, action, saving] = useActionState<SaveState, FormData>(saveProduct, {});
  const [category, setCategory] = useState<Category>(product?.category ?? "tote");
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [stage, setStage] = useState(product?.stage ?? DEFAULT_STAGE.tote);
  const [stageTouched, setStageTouched] = useState(Boolean(product));
  const [colors, setColors] = useState(customColors);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  // No list on the product = it fits every model in config/catalog.ts
  const [allModels, setAllModels] = useState(!product?.models.length);
  const [models, setModels] = useState<string[]>(product?.models ?? []);
  const [modelQuery, setModelQuery] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // The colour picker's "change" fires once the colour is chosen (React's onChange fires while dragging)
  useEffect(() => {
    const picker = colorPickerRef.current;
    if (!picker) return;
    const onPick = async () => {
      const hex = picker.value.toUpperCase();
      setStage(hex);
      setStageTouched(true);
      setColors((list) => (list.includes(hex) ? list : [...list, hex]));
      const saved = await addStageColor(hex).catch(() => null);
      if (saved) setColors(saved);
    };
    picker.addEventListener("change", onPick);
    return () => picker.removeEventListener("change", onPick);
  }, []);
  // Hide a field's error as soon as it's edited; a new save brings fresh errors.
  const [edited, setEdited] = useState<{ for: SaveState; keys: string[] }>({ for: state, keys: [] });
  if (edited.for !== state) setEdited({ for: state, keys: [] });
  const errors = Object.fromEntries(
    Object.entries(state.errors ?? {}).filter(([k]) => !edited.keys.includes(k)),
  ) as NonNullable<SaveState["errors"]>;
  const touch = (key: string) => setEdited((e) => (e.keys.includes(key) ? e : { ...e, keys: [...e.keys, key] }));
  const busy = uploads.some((u) => !u.error);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = [...files].slice(0, PRODUCT_IMAGE.maxPerProduct - images.length);
    for (const file of list) {
      const id = `${file.name}-${Math.random()}`;
      setUploads((u) => [...u, { id, name: file.name }]);
      try {
        const fileId = await uploadFile("product", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId, name: file.name }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed.");
        setImages((imgs) => [...imgs, json as ProductImage]);
        touch("images");
        setUploads((u) => u.filter((x) => x.id !== id));
      } catch (err) {
        setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: (err as Error).message } : x)));
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const moveImage = (i: number, dir: -1 | 1) =>
    setImages((imgs) => {
      const j = i + dir;
      if (j < 0 || j >= imgs.length) return imgs;
      const next = [...imgs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const switchCategory = (c: Category) => {
    setCategory(c);
    if (!stageTouched) setStage(DEFAULT_STAGE[c]);
  };

  const shownModels = searchModels([...new Set([...PHONE_MODELS, ...models])], modelQuery);
  const swatches = [
    ...STAGE_COLORS.map((c) => ({ hex: c.hex as string, label: c.label as string, saved: false })),
    ...colors.map((hex) => ({ hex, label: hex, saved: true })),
  ];
  // A colour that was removed from the saved list stays on the products already using it
  if (!swatches.some((s) => s.hex === stage)) swatches.push({ hex: stage, label: stage, saved: false });

  return (
    <form action={action} className="grid gap-8" noValidate>
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="stage" value={stage} />

      {errors.form && (
        <p role="alert" className="rounded-2xl bg-gum/15 px-5 py-3 font-semibold text-gum-deep">
          {errors.form}
        </p>
      )}

      <Card title="What is it?" hint="This decides where it shows up: the tote rail or the phone case hand on the homepage, and its shop category.">
        <div role="radiogroup" aria-label="Product type" className="grid grid-cols-2 gap-3">
          {(["tote", "case"] as const).map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="category" value={c} checked={category === c} onChange={() => switchCategory(c)} className="peer sr-only" />
              <span className="flex h-full items-center gap-4 rounded-[22px] p-4 ring-2 ring-grape/15 transition-all peer-checked:bg-grape peer-checked:text-milk peer-checked:ring-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape hover:ring-grape/40">
                <span className="grid h-20 w-14 shrink-0 place-items-center">
                  {c === "tote" ? <ToteMockup color="#F4E6D4" className="h-full w-auto" /> : <CaseMockup color="#FFE3EE" className="h-full w-auto" />}
                </span>
                <span>
                  <span className="font-display block text-2xl leading-none">{c === "tote" ? "Tote bag" : "Phone case"}</span>
                  <span className="mt-1 block text-sm opacity-75">{c === "tote" ? "Shows on the tote rail" : "Needs phone models"}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
        <FieldError msg={errors.category} />
      </Card>

      <Card title="Photos" hint="The first photo is the main one. Shoot the product on a plain white background (or upload a PNG with no background): the white is removed and the photo cropped to the product automatically. Use the original photo, not one sent through WhatsApp, at least 1200 px tall.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.src} className="relative overflow-hidden rounded-2xl ring-2 ring-grape/10" style={{ background: stage }}>
              <div className="grid aspect-square place-items-center p-2">
                <Image src={img.src} alt="" width={img.width} height={img.height} sizes="200px" className="max-h-full w-auto object-contain" />
              </div>
              {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-grape px-2 py-0.5 text-xs font-bold text-milk">Main</span>}
              {img.cutout && <span className="absolute top-2 right-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold">Cut-out</span>}
              <div className="flex justify-between bg-white/90 p-1">
                <SmallButton label={`Move photo ${i + 1} left`} onClick={() => moveImage(i, -1)} disabled={i === 0}>
                  ←
                </SmallButton>
                <SmallButton label={`Remove photo ${i + 1}`} onClick={() => setImages((imgs) => imgs.filter((_, k) => k !== i))}>
                  ✕
                </SmallButton>
                <SmallButton label={`Move photo ${i + 1} right`} onClick={() => moveImage(i, 1)} disabled={i === images.length - 1}>
                  →
                </SmallButton>
              </div>
            </li>
          ))}
          {uploads.map((u) => (
            <li key={u.id} className="grid aspect-square place-items-center rounded-2xl bg-white p-3 text-center text-sm ring-2 ring-grape/10">
              {u.error ? (
                <span>
                  <span className="block font-semibold text-gum-deep">{u.error}</span>
                  <button type="button" className="mt-2 underline" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>
                    Dismiss
                  </button>
                </span>
              ) : (
                <span className="animate-pulse font-semibold">Uploading {u.name}…</span>
              )}
            </li>
          ))}
          {images.length < PRODUCT_IMAGE.maxPerProduct && (
            <li>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  uploadFiles(e.dataTransfer.files);
                }}
                className={`grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-3 text-center focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-grape ${
                  dragOver ? "border-gum bg-gum/10" : "border-grape/30 bg-white hover:border-grape/60"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept={PRODUCT_IMAGE.accept.join(",")}
                  className="sr-only"
                  onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                />
                <span>
                  <span className="font-display block text-xl">Add photos</span>
                  <span className="text-xs opacity-70">PNG, JPG or WebP, up to {PRODUCT_IMAGE.maxFileMb} MB</span>
                </span>
              </label>
            </li>
          )}
        </ul>
        <FieldError msg={errors.images} />
      </Card>

      <Card title="Details">
        <div className="grid gap-5">
          <Field label="Name" error={errors.name} htmlFor="name">
            <input id="name" name="name" defaultValue={product?.name} maxLength={80} required className={input} aria-invalid={!!errors.name} onChange={() => touch("name")} />
          </Field>

          {category === "case" ? (
            <Field
              label={`Price (${SITE.currency})`}
              htmlFor="price"
              hint={`Every phone case costs ${formatPrice(CASE_PRICE)} (custom cases ${formatPrice(CASE_PRICE + PRICING.customizationFee.case)}). It's set once for all cases.`}
            >
              <input id="price" value={CASE_PRICE / 100} readOnly aria-readonly className={`${input} max-w-48 bg-grape/5 opacity-80`} />
            </Field>
          ) : (
            <Field label={`Price (${SITE.currency})`} error={errors.price} htmlFor="price">
              <input
                id="price"
                name="price"
                inputMode="decimal"
                defaultValue={product ? (product.price / 100).toString() : ""}
                placeholder="450"
                className={`${input} max-w-48`}
                aria-invalid={!!errors.price}
                onChange={() => touch("price")}
              />
            </Field>
          )}

          <Field label="Short line (optional)" htmlFor="tagline" hint="One playful sentence for cards and the homepage.">
            <input id="tagline" name="tagline" defaultValue={product?.tagline} maxLength={120} className={input} />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            hint={
              category === "case"
                ? "Leave empty to use the standard case description (shown faded below). Write here only to replace it for this case."
                : "Materials, size, care: whatever a customer should know. Leave a blank line between paragraphs."
            }
          >
            <textarea
              id="description"
              name="description"
              defaultValue={product?.description}
              placeholder={category === "case" ? CASE_DESCRIPTION : undefined}
              rows={5}
              maxLength={2000}
              className={`${input} h-auto py-3`}
            />
          </Field>
        </div>
      </Card>

      {category === "case" && (
        <Card title="Phone models" hint="Customers search for their phone on the product page.">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="allModels"
              checked={allModels}
              onChange={(e) => {
                touch("models");
                setAllModels(e.target.checked);
              }}
              className="peer sr-only"
            />
            <span className={toggleTrack} />
            <span>
              <span className="block font-semibold">Fits every model on the list</span>
              <span className="block text-sm opacity-70">
                {PHONE_MODELS.length} models. Customers whose phone isn&apos;t listed can type it. Turn off to offer only some models.
              </span>
            </span>
          </label>

          {!allModels && (
            <div className="mt-5">
              {models.map((m) => (
                <input key={m} type="hidden" name="models" value={m} />
              ))}
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="model-search" className="sr-only">
                  Search models
                </label>
                <input
                  id="model-search"
                  type="search"
                  value={modelQuery}
                  onChange={(e) => setModelQuery(e.target.value)}
                  placeholder="Search, e.g. a54 or 16 pro"
                  className={`${input} max-w-80`}
                />
                <span className="text-sm font-semibold">{models.length} selected</span>
                <button
                  type="button"
                  className="min-h-11 rounded-full px-4 text-sm font-semibold ring-2 ring-grape/20 hover:ring-grape/50"
                  onClick={() => {
                    touch("models");
                    setModels((ms) => [...new Set([...ms, ...shownModels])]);
                  }}
                >
                  Select all shown
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-full px-4 text-sm font-semibold ring-2 ring-grape/20 hover:ring-grape/50"
                  onClick={() => setModels((ms) => ms.filter((m) => !shownModels.includes(m)))}
                >
                  Clear shown
                </button>
              </div>
              <div className="mt-3 flex max-h-80 flex-wrap gap-2 overflow-y-auto p-1">
                {shownModels.map((m) => (
                  <label key={m} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={models.includes(m)}
                      onChange={(e) => {
                        touch("models");
                        setModels((ms) => (e.target.checked ? [...ms, m] : ms.filter((x) => x !== m)));
                      }}
                      className="peer sr-only"
                    />
                    <span className={pill}>{m}</span>
                  </label>
                ))}
                {!shownModels.length && <p className="text-sm opacity-70">No model matches “{modelQuery}”.</p>}
              </div>
            </div>
          )}
          <div className={`mt-4 flex gap-2 ${allModels ? "hidden" : ""}`}>
            <label htmlFor="custom-model" className="sr-only">
              Another model
            </label>
            <input
              id="custom-model"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const m = customModel.trim();
                  if (m) setModels((ms) => [...new Set([...ms, m])]);
                  setCustomModel("");
                }
              }}
              placeholder="Another model, e.g. Pixel 9"
              className={`${input} max-w-72`}
            />
            <button
              type="button"
              className="rounded-full px-4 font-semibold ring-2 ring-grape/20 hover:ring-grape/50"
              onClick={() => {
                const m = customModel.trim();
                if (m) setModels((ms) => [...new Set([...ms, m])]);
                setCustomModel("");
              }}
            >
              Add
            </button>
          </div>
          <FieldError msg={errors.models} />
        </Card>
      )}

      <Card
        title="Showcase color"
        hint="The background behind this product on the homepage and its product page. Press + to pick any colour; it's saved for all your products."
      >
        <div className="flex flex-wrap gap-3">
          {swatches.map((c) => (
            <div key={c.hex} className="relative">
              <label className="block cursor-pointer text-center">
                <input
                  type="radio"
                  name="stage-choice"
                  checked={stage === c.hex}
                  onChange={() => {
                    setStage(c.hex);
                    setStageTouched(true);
                  }}
                  className="peer sr-only"
                />
                <span
                  className="mx-auto block size-12 rounded-full ring-2 ring-grape/20 transition-transform peer-checked:scale-110 peer-checked:ring-4 peer-checked:ring-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape"
                  style={{ background: c.hex }}
                />
                <span className="mt-1 block text-xs font-medium">{c.label}</span>
              </label>
              {c.saved && (
                <button
                  type="button"
                  aria-label={`Remove ${c.hex} from the saved colours`}
                  title="Remove from saved colours"
                  onClick={async () => {
                    setColors((list) => list.filter((x) => x !== c.hex));
                    const saved = await removeStageColor(c.hex).catch(() => null);
                    if (saved) setColors(saved);
                  }}
                  className="group/x absolute -top-4 -right-4 grid size-10 place-items-center rounded-full"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-white text-sm font-bold shadow ring-2 ring-grape/15 group-hover/x:ring-grape/50">
                    ×
                  </span>
                </button>
              )}
            </div>
          ))}
          <div className="text-center">
            <span className="relative mx-auto grid size-12 place-items-center rounded-full border-2 border-dashed border-grape/40 text-2xl font-bold focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-grape hover:border-grape">
              +
              <input
                ref={colorPickerRef}
                type="color"
                defaultValue="#ff8fc8"
                aria-label="Add a colour"
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </span>
            <span className="mt-1 block text-xs font-medium">Add colour</span>
          </div>
        </div>
      </Card>

      <Card title="Visibility">
        <div className="grid gap-3">
          <Toggle name="published" defaultChecked={product?.published ?? true} label="Published" hint="Show this product in the store." />
          <Toggle name="isNew" defaultChecked={product?.isNew ?? true} label="New" hint="Show it in “Fresh drops” on the homepage with a New badge." />
        </div>
      </Card>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-3 border-t-2 border-grape/10 bg-milk/95 px-5 py-4 backdrop-blur-sm">
        <button type="submit" className="btn" disabled={saving || busy}>
          {saving ? "Saving…" : busy ? "Waiting for photos…" : product ? "Save changes" : "Add product"}
        </button>
        <Link href="/admin" className="btn btn-ghost">
          Cancel
        </Link>
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="font-semibold text-gum-deep">
            Check the highlighted fields.
          </p>
        )}
      </div>
    </form>
  );
}

const input =
  "h-12 w-full rounded-2xl border-2 border-grape/20 bg-white px-4 text-lg outline-none focus:border-grape aria-invalid:border-gum-deep";
const pill =
  "flex h-11 items-center rounded-full px-4 font-semibold ring-2 ring-grape/15 transition-colors peer-checked:bg-grape peer-checked:text-milk peer-checked:ring-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape hover:ring-grape/40";

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] bg-white p-5 ring-2 ring-grape/10 md:p-6">
      <h2 className="font-display text-2xl">{title}</h2>
      {hint && <p className="mt-1 mb-4 text-sm opacity-70">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="font-semibold">
        {label}
      </label>
      {hint && <p className="text-sm opacity-70">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      <FieldError msg={error} />
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-sm font-semibold text-gum-deep">{msg}</p>;
}

const toggleTrack =
  "relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-grape/20 transition-colors peer-checked:bg-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5";

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className={toggleTrack} />
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm opacity-70">{hint}</span>
      </span>
    </label>
  );
}

function SmallButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className="grid size-9 place-items-center rounded-full font-bold hover:bg-grape/10 disabled:opacity-25">
      {children}
    </button>
  );
}
