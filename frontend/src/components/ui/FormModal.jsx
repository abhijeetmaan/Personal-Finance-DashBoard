import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { modalBackdrop, modalPanel } from "../../animations/variants";

function FormModal({ isOpen = false, onClose, title, description, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const node = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="form-modal-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={modalBackdrop.initial}
          animate={modalBackdrop.animate}
          exit={modalBackdrop.exit}
          transition={modalBackdrop.transition}
        >
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={modalBackdrop.initial}
            animate={modalBackdrop.animate}
            exit={modalBackdrop.exit}
            transition={modalBackdrop.transition}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-modal-title"
            className="relative z-10 max-h-[min(90vh,880px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
            initial={modalPanel.initial}
            animate={modalPanel.animate}
            exit={modalPanel.exit}
            transition={modalPanel.transition}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-[1] flex items-start justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
              <div className="min-w-0">
                <h2
                  id="form-modal-title"
                  className="text-lg font-semibold text-slate-900 dark:text-white"
                >
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 pt-4">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}

export default FormModal;
