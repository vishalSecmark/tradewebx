"use client";

import React, { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(",");

type AccessibleModalProps = {
  isOpen: boolean;
  onDismiss?: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: "dialog" | "alertdialog";
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
  initialFocusSelector?: string;
  id?: string;
};

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [];
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  return elements.filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true" &&
      el.tabIndex !== -1,
  );
};

const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onDismiss,
  labelledBy,
  describedBy,
  role = "dialog",
  children,
  className = "",
  overlayClassName = "",
  closeOnOverlayClick = true,
  initialFocusSelector,
  id,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    lastFocusedElementRef.current = document.activeElement as HTMLElement;

    const dialogNode = dialogRef.current;
    const focusInitialElement = () => {
      if (!dialogNode) return;
      if (initialFocusSelector) {
        const initialEl = dialogNode.querySelector<HTMLElement>(
          initialFocusSelector,
        );
        if (initialEl) {
          initialEl.focus();
          return;
        }
      }

      const [firstFocusable] = getFocusableElements(dialogNode);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        dialogNode.focus();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (onDismiss) {
          event.preventDefault();
          onDismiss();
        }
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const isShiftPressed = event.shiftKey;
      const currentActive = document.activeElement;

      if (!isShiftPressed && currentActive === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (isShiftPressed && currentActive === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    };

    focusInitialElement();
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (lastFocusedElementRef.current) {
        lastFocusedElementRef.current.focus();
      }
    };
  }, [initialFocusSelector, isOpen, onDismiss]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && onDismiss) {
      onDismiss();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center px-4 py-6 sm:px-6 ${overlayClassName}`}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={handleOverlayClick}
      />
      <div
        ref={dialogRef}
        id={id}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-lg rounded-lg focus:outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default AccessibleModal;
