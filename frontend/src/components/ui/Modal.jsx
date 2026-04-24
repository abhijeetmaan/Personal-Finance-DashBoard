import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Trash2, X } from "lucide-react";
import { modalBackdrop, modalPanel } from "../../animations/variants";

function Modal({
  isOpen = false,
  onClose,
  title,
  description,
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
}) {
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

  const confirmClasses =
    variant === "danger"
      ? "rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300/50 dark:focus:ring-red-900/40"
      : "rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-200 dark:focus:ring-cyan-900/40";

  const node = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="modal-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
            aria-labelledby="modal-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            initial={modalPanel.initial}
            animate={modalPanel.animate}
            exit={modalPanel.exit}
            transition={modalPanel.transition}
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="modal-title"
              className="text-xl font-semibold text-slate-900 dark:text-white"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {description}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300/60 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus:ring-slate-500/40"
              >
                <X className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => onConfirm?.()}
                className={`inline-flex items-center justify-center gap-2 ${confirmClasses}`}
              >
                {variant === "danger" ? (
                  <Trash2
                    className="h-4 w-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : (
                  <Check
                    className="h-4 w-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                )}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}

export default Modal;
