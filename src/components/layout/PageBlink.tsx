import { ViewTransition } from "react";

/**
 * Render once per page. Its enter/exit tells React to run a view transition
 * on navigation; the blink itself is styled on the outgoing root snapshot
 * in globals.css, so the old page always closes toward the viewport centre.
 */
export function PageBlink() {
  return (
    <ViewTransition enter="blink-trigger" exit="blink-trigger" default="none">
      <span aria-hidden className="pointer-events-none fixed top-0 left-0 size-px opacity-0" />
    </ViewTransition>
  );
}
