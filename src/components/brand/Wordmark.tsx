/**
 * The WINKY wordmark. Lowercase, inflated, with the tittle of the "i"
 * replaced by a blue-raspberry eye that can wink.
 */
export function Wordmark({
  className,
  eyeColor = "var(--color-cobalt)",
  winkOnHover = true,
}: {
  className?: string;
  eyeColor?: string;
  winkOnHover?: boolean;
}) {
  return (
    <span className={`font-display inline-flex items-baseline leading-none ${winkOnHover ? "wink-host" : ""} ${className ?? ""}`}>
      <span className="sr-only">WINKY</span>
      <span aria-hidden className="inline-flex items-baseline">
        <span>w</span>
        <span className="relative inline-block">
          ı
          <span
            className="wink-eye absolute left-1/2 -translate-x-1/2"
            style={{
              background: eyeColor,
              width: "0.26em",
              height: "0.26em",
              top: "0.02em",
            }}
          />
        </span>
        <span>nky</span>
      </span>
    </span>
  );
}
