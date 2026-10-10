import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BROWN, CREAM, SANS } from "@/app/constants";

const ARROW_GAP_PX = 6;

type TooltipPlacement = "before" | "after";
type TooltipShape = "point" | "pill";

type TierIconNameTooltipProps = {
  label?: string;
  content?: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  shape?: TooltipShape;
  zIndex?: number;
};

function updatePosition(
  anchor: HTMLElement,
  placement: TooltipPlacement,
  setCoords: (coords: { top: number; left: number }) => void,
) {
  const rect = anchor.getBoundingClientRect();
  setCoords({
    top: rect.top + rect.height / 2,
    left:
      placement === "after"
        ? rect.right + ARROW_GAP_PX
        : rect.left - ARROW_GAP_PX,
  });
}

export function TierIconNameTooltip({
  label,
  content,
  children,
  placement = "before",
  shape = "point",
  zIndex = 60,
}: TierIconNameTooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const after = placement === "after";
  const pill = shape === "pill";

  const show = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    updatePosition(anchor, placement, setCoords);
    setVisible(true);
  }, [placement]);

  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!visible) return;

    const onResize = () => {
      const anchor = anchorRef.current;
      if (anchor) updatePosition(anchor, placement, setCoords);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [placement, visible]);

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            role="tooltip"
            aria-hidden={false}
            className={`pointer-events-none fixed -translate-y-1/2 ${
              after ? "" : "z-[60] -translate-x-full"
            }`}
            style={{ top: coords.top, left: coords.left, zIndex }}
          >
            <span
              className={
                pill
                  ? "block rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap"
                  : after
                    ? "block rounded-r-full py-1.5 pl-5 pr-3 text-left text-xs"
                    : "block rounded-l-full py-1 pl-3 pr-5 text-xs font-medium whitespace-nowrap"
              }
              style={{
                fontFamily: SANS,
                background: BROWN,
                color: CREAM,
                clipPath: pill
                  ? undefined
                  : after
                    ? "polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)"
                    : "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
              }}
            >
              {content ?? label}
            </span>
          </div>,
          document.body,
        )}
    </>
  );
}
