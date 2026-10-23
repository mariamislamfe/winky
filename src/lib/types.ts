import type { TextColorId, TextStyleId } from "@/config/customization";

export type Category = "tote" | "case";

export type ArtKind =
  | "winks"
  | "gumballs"
  | "cherries"
  | "harlequin"
  | "ripple"
  | "bubbles"
  | "daisies"
  | "hearts"
  | "stars"
  | "sunny"
  | "drips"
  | "bigwink"
  | "plain";

/** Four-colour palette an illustrated sample design is drawn from. */
export type Palette = { base: string; a: string; b: string; ink: string };

/** Illustrated artwork, only used by the built-in sample products. */
export type Artwork = { kind: ArtKind; palette: Palette };

/** A product photo uploaded from the dashboard (stored as WebP). */
export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** True when the photo has a transparent background (a cut-out) */
  cutout: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  /** Optional one-liner shown on cards and showcases */
  tagline: string;
  description: string;
  /** Price in minor units (e.g. cents / piasters) */
  price: number;
  /** First image is the main one */
  images: ProductImage[];
  /** Background colour used by showcases when this product is in focus */
  stage: string;
  /** Text colour that reads well on `stage` (computed on save) */
  stageInk: string;
  /** Phone cases: the phone models this design is available for */
  models: string[];
  isNew: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  /** Built-in blank bases used by the customizer (not managed in the dashboard) */
  customOnly?: boolean;
  /**
   * Built-in sample product, shown only while no real products are published.
   * Drawn from `art` instead of photos.
   */
  sample?: boolean;
  art?: Artwork;
};

/**
 * Layer placement is stored relative to the product's print area so it is
 * independent of screen size: x/y are the layer's centre (0 = left/top edge,
 * 1 = right/bottom edge), sizes are fractions of the print area's width.
 */
type Placement = { id: string; x: number; y: number; rotation: number };

export type ImageLayer = Placement & {
  kind: "image";
  /** Downscaled preview copy (data URL) kept in the browser */
  src: string;
  /** The customer's original file, stored on the server for printing */
  fileId?: string;
  name: string;
  /** height / width of the image */
  aspect: number;
  originalWidth: number;
  originalHeight: number;
  /** Width as a fraction of the print area's width */
  width: number;
};

export type TextLayer = Placement & {
  kind: "text";
  text: string;
  style: TextStyleId;
  color: TextColorId;
  /** Font size as a fraction of the print area's width */
  size: number;
};

export type DesignLayer = ImageLayer | TextLayer;

export type Customization = {
  /** Plain product color id (see PLAIN_BASES) */
  baseId: string;
  /** Bottom to top */
  layers: DesignLayer[];
};

export type CartLine = {
  id: string;
  slug: string;
  quantity: number;
  /** e.g. phone model for cases */
  variant?: string;
  custom?: Customization;
};

// ── Orders ───────────────────────────────────────────────────────

export type OrderStatus = "new" | "placed" | "shipped" | "delivered" | "cancelled";

export type OrderCustomer = {
  name: string;
  phone: string;
  email: string;
  governorate: string;
  city: string;
  address: string;
  notes: string;
};

/** A snapshot of what was bought, so the order stays readable if products change later. */
export type OrderLine = {
  slug: string;
  name: string;
  category: Category;
  quantity: number;
  /** Price per item in minor units, as charged */
  unitPrice: number;
  /** Phone model for cases */
  variant?: string;
  /** Main product photo at the time of ordering */
  image?: ProductImage;
  /** Custom design: product colour + layers (image layers reference stored files) */
  custom?: Customization;
};

export type DepositStatus = "pending" | "received" | "rejected";

/** InstaPay deposit paid before the order is confirmed. */
export type OrderDeposit = {
  /** Minor units */
  amount: number;
  status: DepositStatus;
  /** Name or InstaPay number/address the customer paid from */
  payer: string;
  /** Optional transfer reference the customer typed */
  reference: string;
  /** Screenshot of the transfer, stored privately */
  receiptFileId: string;
};

export type Order = {
  id: string;
  /** Human-friendly number, e.g. WK-1001 */
  number: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  paymentMethod: "instapay-deposit";
  deposit: OrderDeposit;
  /** What's left to collect in cash on delivery (before delivery fee if not set) */
  codBalance: number;
  customer: OrderCustomer;
  lines: OrderLine[];
  subtotal: number;
  /** null = not set yet (confirmed with the customer) */
  shipping: number | null;
  total: number;
  currency: string;
  /** Order number on Zink, once placed there */
  zinkRef: string;
  /** Private note for the team */
  adminNote: string;
};
