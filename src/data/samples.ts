import { CASE_PRICE } from "@/config/pricing";
import type { Artwork, Category, Product } from "@/lib/types";

/**
 * SAMPLE PRODUCTS: illustrated stand-ins that keep the store looking alive
 * until you publish your first real product from the dashboard. As soon as
 * one real product is published, all of these disappear automatically.
 * Names, art and prices here are placeholders, not real WINKY products.
 */
type Sample = {
  slug: string;
  name: string;
  category: Category;
  tagline: string;
  description: string;
  art: Artwork;
  stage: string;
  stageInk: string;
  isNew?: boolean;
};

const PRICE: Record<Category, number> = { tote: 45000, case: CASE_PRICE };

const SAMPLES: Sample[] = [
  // ── Tote bags ────────────────────────────────────────────────
  {
    slug: "big-wink-tote",
    name: "Big Wink Tote",
    category: "tote",
    tagline: "One giant wink. Zero subtlety.",
    description: "Our mascot at full volume: one open eye, one cheeky wink and a grin, printed big on a bubblegum tote.",
    art: { kind: "bigwink", palette: { base: "#FF4F9A", a: "#FF8DBE", b: "#2B1140", ink: "#2B1140" } },
    stage: "#FFE15A",
    stageInk: "#2B1140",
    isNew: true,
  },
  {
    slug: "gumball-machine-tote",
    name: "Gumball Machine Tote",
    category: "tote",
    tagline: "Every flavor, no coins needed.",
    description: "A scatter of shiny gumballs in bubblegum, blue raspberry and lemon drop on a natural base.",
    art: { kind: "gumballs", palette: { base: "#F4E6D4", a: "#FF4F9A", b: "#3D4BFF", ink: "#FFC21A" } },
    stage: "#9AF0C8",
    stageInk: "#2B1140",
  },
  {
    slug: "cherry-pop-tote",
    name: "Cherry Pop Tote",
    category: "tote",
    tagline: "Sweet outside. Your stuff inside.",
    description: "Pairs of glossy cherries tumbling across strawberry-milk pink.",
    art: { kind: "cherries", palette: { base: "#FFE3EE", a: "#FF3B5C", b: "#2FBF71", ink: "#2B1140" } },
    stage: "#FF4F9A",
    stageInk: "#2B1140",
    isNew: true,
  },
  {
    slug: "harlequin-crush-tote",
    name: "Harlequin Crush Tote",
    category: "tote",
    tagline: "Diamonds, but make them bubblegum.",
    description: "A two-tone pink harlequin with tiny grape dots at every corner.",
    art: { kind: "harlequin", palette: { base: "#FF8DBE", a: "#FF4F9A", b: "#FFD1E4", ink: "#2B1140" } },
    stage: "#FFE15A",
    stageInk: "#2B1140",
  },
  {
    slug: "daisy-chain-tote",
    name: "Daisy Chain Tote",
    category: "tote",
    tagline: "A meadow you can carry.",
    description: "Milky daisies with lemon centres, scattered on spearmint green.",
    art: { kind: "daisies", palette: { base: "#9AF0C8", a: "#FFF0F5", b: "#FFC21A", ink: "#2B1140" } },
    stage: "#FF8DBE",
    stageInk: "#2B1140",
  },
  {
    slug: "drip-drop-tote",
    name: "Drip Drop Tote",
    category: "tote",
    tagline: "Pink drips, zero mess.",
    description: "A bubblegum glaze drips down the top, with candy sprinkles below.",
    art: { kind: "drips", palette: { base: "#F4E6D4", a: "#FF4F9A", b: "#3D4BFF", ink: "#FFC21A" } },
    stage: "#FFE15A",
    stageInk: "#2B1140",
  },

  // ── Phone cases ──────────────────────────────────────────────
  {
    slug: "wink-wink-case",
    name: "Wink Wink Case",
    category: "case",
    tagline: "Your phone, flirting back.",
    description: "Rows of winking faces in grape and bubblegum on lemon-drop yellow.",
    art: { kind: "winks", palette: { base: "#FFE15A", a: "#2B1140", b: "#FF4F9A", ink: "#2B1140" } },
    stage: "#FF4F9A",
    stageInk: "#2B1140",
    isNew: true,
  },
  {
    slug: "blue-raspberry-ripple-case",
    name: "Blue Raspberry Ripple Case",
    category: "case",
    tagline: "A swirl of the good flavor.",
    description: "Wavy candy stripes of pink and milk on blue raspberry.",
    art: { kind: "ripple", palette: { base: "#3D4BFF", a: "#FF8DBE", b: "#FFF0F5", ink: "#2B1140" } },
    stage: "#FFD1E4",
    stageInk: "#2B1140",
  },
  {
    slug: "heart-throb-case",
    name: "Heart Throb Case",
    category: "case",
    tagline: "Heart on your sleeve, case on your phone.",
    description: "Tilted hearts in milk and deep pink, packed onto bubblegum.",
    art: { kind: "hearts", palette: { base: "#FF4F9A", a: "#FFF0F5", b: "#C81F6A", ink: "#2B1140" } },
    stage: "#2B1140",
    stageInk: "#FFF0F5",
  },
  {
    slug: "lucky-stars-case",
    name: "Lucky Stars Case",
    category: "case",
    tagline: "Grape night, lemon stars.",
    description: "Chunky lemon stars and pink sparkles on a deep grape sky.",
    art: { kind: "stars", palette: { base: "#2B1140", a: "#FFE15A", b: "#FF8DBE", ink: "#FFF0F5" } },
    stage: "#9AF0C8",
    stageInk: "#2B1140",
  },
  {
    slug: "sunny-side-case",
    name: "Sunny Side Case",
    category: "case",
    tagline: "Sunny side up, all day.",
    description: "Wobbly fried eggs on spearmint. Breakfast that never gets cold.",
    art: { kind: "sunny", palette: { base: "#9AF0C8", a: "#FFFFFF", b: "#FFC21A", ink: "#2B1140" } },
    stage: "#3D4BFF",
    stageInk: "#FFF0F5",
    isNew: true,
  },
  {
    slug: "bubble-trouble-case",
    name: "Bubble Trouble Case",
    category: "case",
    tagline: "Bubbles that never pop.",
    description: "Milky bubbles with blue raspberry rims floating on pink.",
    art: { kind: "bubbles", palette: { base: "#FF8DBE", a: "#FFF0F5", b: "#3D4BFF", ink: "#2B1140" } },
    stage: "#FFE15A",
    stageInk: "#2B1140",
  },
  {
    slug: "gumball-case",
    name: "Gumball Case",
    category: "case",
    tagline: "The gumball machine, pocket edition.",
    description: "Shiny gumballs in three flavors on strawberry milk.",
    art: { kind: "gumballs", palette: { base: "#FFF0F5", a: "#FF4F9A", b: "#3D4BFF", ink: "#FFC21A" } },
    stage: "#3D4BFF",
    stageInk: "#FFF0F5",
  },
  {
    slug: "checkmate-case",
    name: "Checkmate Case",
    category: "case",
    tagline: "Lemon diamonds, blue raspberry ground.",
    description: "A bold harlequin of lemon and blue raspberry with grape pin-dots.",
    art: { kind: "harlequin", palette: { base: "#FFE15A", a: "#3D4BFF", b: "#FFE15A", ink: "#2B1140" } },
    stage: "#FF4F9A",
    stageInk: "#2B1140",
  },
];

export const SAMPLE_PRODUCTS: Product[] = SAMPLES.map((s) => ({
  ...s,
  id: `sample-${s.slug}`,
  price: PRICE[s.category],
  images: [],
  // Cases fit every listed model
  models: [],
  isNew: Boolean(s.isNew),
  published: true,
  createdAt: "",
  updatedAt: "",
  sample: true,
}));
