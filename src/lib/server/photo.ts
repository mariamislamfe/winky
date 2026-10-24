import "server-only";
import sharp from "sharp";

/**
 * Turns an uploaded product photo into the stored WebP:
 *
 * 1. Auto-rotates (EXIF) and shrinks to at most `maxPx` on the longest side.
 * 2. Plain white or light grey background (like a photo taken on a sheet of
 *    paper): removes it. Only background connected to the photo's edges
 *    goes, so white parts inside the design stay.
 * 3. Transparent background (uploaded cut-out or step 2): crops to the
 *    product so it fills its frame instead of floating in empty space.
 *
 * Photos on coloured, busy or gradient backgrounds are kept as they are.
 */
export async function processProductPhoto(input: Buffer, maxPx: number) {
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: maxPx, height: maxPx, fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  if (transparentEdgeShare(data, width, height) < 0.3) removePlainBackground(data, width, height);
  const cutout = transparentEdgeShare(data, width, height) >= 0.3;

  let image = sharp(data, { raw: { width, height, channels: 4 } });
  let size = { width, height };
  if (cutout) {
    const box = productBox(data, width, height);
    if (box) {
      image = sharp(await image.extract(box).png().toBuffer());
      size = { width: box.width, height: box.height };
    }
  } else {
    image = image.removeAlpha();
  }
  const out = await image.webp({ quality: 90, alphaQuality: 92 }).toBuffer();
  return { data: out, ...size, cutout };
}

/** Share of the outermost pixels that are (mostly) transparent. */
function transparentEdgeShare(px: Buffer, w: number, h: number) {
  let clear = 0;
  let total = 0;
  forEachEdge(w, h, (i) => {
    total++;
    if (px[i * 4 + 3] < 128) clear++;
  });
  return clear / total;
}

function forEachEdge(w: number, h: number, fn: (i: number) => void) {
  for (let x = 0; x < w; x++) {
    fn(x);
    fn((h - 1) * w + x);
  }
  for (let y = 1; y < h - 1; y++) {
    fn(y * w);
    fn(y * w + w - 1);
  }
}

/** How far a colour may drift from the background colour and still count as background. */
const TOLERANCE = 42;
/** Share of the edge that must match the background colour for it to count as "plain". */
const PLAIN_EDGE = 0.9;

function removePlainBackground(px: Buffer, w: number, h: number) {
  // Background colour = median of the edge pixels, channel by channel
  const r: number[] = [];
  const g: number[] = [];
  const b: number[] = [];
  forEachEdge(w, h, (i) => {
    r.push(px[i * 4]);
    g.push(px[i * 4 + 1]);
    b.push(px[i * 4 + 2]);
  });
  const median = (v: number[]) => v.sort((p, q) => p - q)[v.length >> 1];
  const bg = [median(r), median(g), median(b)];
  // Only white / light grey: coloured backdrops often hide shapes we'd cut badly
  if (Math.min(...bg) < 170 || Math.max(...bg) - Math.min(...bg) > 40) return;
  const dist = (i: number) =>
    Math.hypot(px[i * 4] - bg[0], px[i * 4 + 1] - bg[1], px[i * 4 + 2] - bg[2]);

  let plain = 0;
  let total = 0;
  forEachEdge(w, h, (i) => {
    total++;
    if (dist(i) <= TOLERANCE) plain++;
  });
  if (plain / total < PLAIN_EDGE) return;

  // Flood fill from the edges through background-coloured pixels
  const removed = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const visit = (i: number) => {
    if (!removed[i] && dist(i) <= TOLERANCE) {
      removed[i] = 1;
      queue[tail++] = i;
    }
  };
  forEachEdge(w, h, visit);
  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    if (x > 0) visit(i - 1);
    if (x < w - 1) visit(i + 1);
    if (i >= w) visit(i - w);
    if (i < w * (h - 1)) visit(i + w);
  }

  for (let i = 0; i < w * h; i++) {
    if (removed[i]) {
      px[i * 4 + 3] = 0;
      continue;
    }
    // Soften the outline: product pixels touching the background fade with their colour distance
    const x = i % w;
    const touches =
      (x > 0 && removed[i - 1]) || (x < w - 1 && removed[i + 1]) || (i >= w && removed[i - w]) || (i < w * (h - 1) && removed[i + w]);
    if (touches) px[i * 4 + 3] = Math.round(px[i * 4 + 3] * Math.min(1, Math.max(0.35, (dist(i) - TOLERANCE) / TOLERANCE + 0.35)));
  }
}

/**
 * The product's bounding box plus a little breathing room, or null if it
 * already fills the photo. Rows and columns with only a few stray pixels
 * (dust, leftover specks) don't count.
 */
function productBox(px: Buffer, w: number, h: number) {
  const cols = new Uint32Array(w);
  const rows = new Uint32Array(h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 16) {
        cols[x]++;
        rows[y]++;
      }
    }
  }
  const minCol = Math.max(3, h * 0.01);
  const minRow = Math.max(3, w * 0.01);
  let left = 0;
  let right = w - 1;
  let top = 0;
  let bottom = h - 1;
  while (left < w && cols[left] < minCol) left++;
  while (right > left && cols[right] < minCol) right--;
  while (top < h && rows[top] < minRow) top++;
  while (bottom > top && rows[bottom] < minRow) bottom--;
  if (left >= right || top >= bottom) return null;
  const pad = Math.round(Math.max(right - left, bottom - top) * 0.02);
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  right = Math.min(w - 1, right + pad);
  bottom = Math.min(h - 1, bottom + pad);
  if (left === 0 && top === 0 && right === w - 1 && bottom === h - 1) return null;
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}
