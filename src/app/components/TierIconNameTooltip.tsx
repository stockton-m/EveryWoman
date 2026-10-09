import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BROWN, CREAM, SANS } from "@/app/constants";

const ARROW_GAP_PX = 6;

type TierIconNameTooltipProps = {
  label: string;
  children: ReactNode;
};

function updatePosition(
  anchor: HTMLElement,
  setCoords: (coords: { top: number; left: number }) => void,
) {
  const rect = anchor.getBoundingClientRect();
  setCoords({
    top: rect.top + rect.height / 2,
    left: rect.left - ARROW_GAP_PX,
  });
}

export function TierIconNameTooltip({
  label,
  children,
}: TierIconNameTooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const show = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    updatePosition(anchor, setCoords);
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!visible) return;

    const onResize = () => {
      const anchor = anchorRef.current;
      if (anchor) updatePosition(anchor, setCoords);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visible]);

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
            className="pointer-events-none fixed z-[60] -translate-x-full -translate-y-1/2"
            style={{ top: coords.top, left: coords.left }}
          >
            <span
              className="block rounded-l-full py-1 pl-3 pr-5 text-xs font-medium whitespace-nowrap"
              style={{
                fontFamily: SANS,
                background: BROWN,
                color: CREAM,
                clipPath:
                  "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
              }}
            >
              {label}
            </span>
          </div>,
          document.body,
        )}
    </>
  );
}
