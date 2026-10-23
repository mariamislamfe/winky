"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Modal sheet built on the native <dialog> (focus trap, Esc, inert page)
 * with a springy panel. Closing waits for the exit animation.
 */
export function Sheet({
  open,
  onClose,
  label,
  side = "right",
  children,
  panelClassName = "",
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  side?: "right" | "full";
  children: ReactNode;
  panelClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(open);

  if (open && !mounted) setMounted(true);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.dataset.scrollLock = "true";
    }
  }, [open, mounted]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.scrollLock;
    };
  }, []);

  const finishClose = () => {
    ref.current?.close();
    delete document.documentElement.dataset.scrollLock;
    setMounted(false);
  };

  const panelMotion =
    side === "right"
      ? {
          initial: reduce ? { opacity: 0 } : { x: "105%", rotate: 4 },
          animate: reduce ? { opacity: 1 } : { x: 0, rotate: 0 },
          exit: reduce ? { opacity: 0 } : { x: "105%", rotate: 3 },
        }
      : {
          initial: reduce ? { opacity: 0 } : { clipPath: "ellipse(80% 0% at 50% 0%)" },
          animate: reduce ? { opacity: 1 } : { clipPath: "ellipse(150% 150% at 50% 0%)" },
          exit: reduce ? { opacity: 0 } : { clipPath: "ellipse(80% 0% at 50% 0%)" },
        };

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent"
    >
      <AnimatePresence onExitComplete={finishClose}>
        {open && (
          <>
            <motion.div
              key="scrim"
              aria-hidden
              className="fixed inset-0 bg-grape/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
            />
            <motion.div
              key="panel"
              {...panelMotion}
              transition={
                side === "right"
                  ? { type: "spring", stiffness: 380, damping: 34 }
                  : { duration: reduce ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }
              }
              className={
                side === "right"
                  ? `fixed inset-y-0 right-0 flex w-full max-w-[460px] origin-bottom-left flex-col ${panelClassName}`
                  : `fixed inset-0 flex flex-col ${panelClassName}`
              }
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </dialog>
  );
}
