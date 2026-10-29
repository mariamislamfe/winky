import { formatPrice } from "@/lib/format";

/**
 * A price with the old one crossed out next to it when there's an offer
 * (COMPARE_AT in config/pricing.ts). Screen readers hear "was … now …".
 */
export function Price({
  value,
  was,
  stacked,
  className = "",
  wasClassName = "",
}: {
  value: number;
  was?: number | null;
  /** Old price under the new one instead of beside it (narrow spots) */
  stacked?: boolean;
  className?: string;
  wasClassName?: string;
}) {
  if (!was || was <= value) return <span className={`tabular-nums ${className}`}>{formatPrice(value)}</span>;
  return (
    <span className={`inline-flex tabular-nums ${stacked ? "flex-col items-end" : "flex-wrap items-baseline gap-x-2"} ${className}`}>
      <span>
        <span className="sr-only">Now </span>
        {formatPrice(value)}
      </span>
      <s className={`font-normal decoration-gum-deep decoration-2 opacity-60 ${stacked ? "text-[0.8em]" : "text-[0.75em]"} ${wasClassName}`}>
        <span className="sr-only">was </span>
        {formatPrice(was)}
      </s>
    </span>
  );
}
