/** The WINKY glyph: one open eye, one wink. */
export function WinkMark({
  className,
  eye = "currentColor",
  title,
}: {
  className?: string;
  eye?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 44 24"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <circle cx="10" cy="11" r="8" fill={eye} />
      <path d="M26 8 Q34 18 42 8" stroke={eye} strokeWidth="5.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
