"use client";

import { useEffect, useRef } from "react";

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string; // Used for screen readers, not visually rendered
  children: React.ReactNode;
  width?: string;        // Tailwind width: e.g. "max-w-[80vw]"
  height?: string;       // Tailwind height: e.g. "min-h-[80vh] max-h-[80vh]"
  parentZIndex?: string; // Tailwind z-index: e.g. "z-400"
  showCloseButton?: boolean; // optional if you want default close button
  closeButtonLabel?: string;
}

export default function AccessibleModalEntry({
  isOpen,
  onClose,
  title = "Modal Dialog",
  children,
  width = "max-w-[80vw]",
  height = "max-h-[80vh] min-h-[80vh]",
  parentZIndex = "z-50",
  showCloseButton = false,
  closeButtonLabel = "Close",
}: AccessibleModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      `a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])`
    );

    if (focusable.length > 0) {
      focusable[0].focus();
    }

    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-5 ${parentZIndex}`}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white rounded-lg shadow-xl w-full flex flex-col ${width} ${height} overflow-hidden`}
      >
        {/* Screen-reader only title (NOT visible) */}
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>

        {/* Optional built-in close button */}
        {showCloseButton && (
          <button
            aria-label={closeButtonLabel}
            onClick={onClose}
            className="absolute top-4 right-4 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            ✕
          </button>
        )}

        {/* User-rendered content */}
        <div className="w-full h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
