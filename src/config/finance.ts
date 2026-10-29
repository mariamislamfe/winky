/** Finance page (/admin/finance): what money can go out on. */
export const EXPENSE_CATEGORIES = [
  { id: "ads", label: "Ads" },
  { id: "materials", label: "Materials" },
  { id: "packaging", label: "Packaging" },
  { id: "delivery", label: "Delivery" },
  { id: "other", label: "Other" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["id"];
