import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AboutImagePlaceholder } from "@/app/components/about/AboutImagePlaceholder";
import { getAboutEthosCardStyle } from "@/app/components/about/AboutWomanProfile";
import type { AboutProfile } from "@/app/content/about";
import { BLUSH, EMBER, MONO, SAGE, SANS, SERIF } from "@/app/constants";

const ACCENTS = {
  orange: EMBER,
  green: SAGE,
  pink: BLUSH,
} as const;

const TITLE_ID = "about-woman-modal-title";

type AboutWomanModalProps = {
  profile: AboutProfile | null;
  index: number;
  onClose: () => void;
};

export function AboutWomanModal({
  profile,
  index,
  onClose,
}: AboutWomanModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isOpen = profile !== null;

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = closeButtonRef.current?.closest('[role="dialog"]');
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!profile) return null;

  const cardStyle = getAboutEthosCardStyle(index);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-8"
      style={{ background: "rgba(42,31,26,0.62)" }}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="about-ethos-modal relative flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] p-6 sm:p-8 md:rounded-[3rem] md:p-12"
        style={{
          minHeight: "min(42rem, calc(100dvh - 3rem))",
          maxHeight: "calc(100dvh - 1.5rem)",
          background: cardStyle.background,
          boxShadow: "0 32px 90px rgba(42,31,26,0.3)",
          color: cardStyle.color,
          fontFamily: SANS,
        }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="pill-btn pill-btn--icon absolute right-5 top-5 z-20 rounded-full p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:right-8 md:top-8"
          style={{ color: cardStyle.color }}
          aria-label="Close profile"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="about-ethos-modal__layout">
          <AboutImagePlaceholder
            accent={ACCENTS[profile.accent]}
            className="about-ethos-modal__image"
            label={`Placeholder portrait for ${profile.name}`}
          />

          <div className="about-ethos-modal__copy">
            <p
              className="about-ethos-modal__role"
              style={{ fontFamily: MONO }}
            >
              {profile.role}
            </p>
            <h2
              id={TITLE_ID}
              className="about-ethos-modal__name"
              style={{ fontFamily: SERIF }}
            >
              {profile.name}
            </h2>
            <p className="about-ethos-modal__desc">{profile.description}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
