import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { collapseCutoffEllipsis } from "@/app/content/clampTitle";

type ClampedTitleProps = {
  as?: "h2" | "h3";
  className?: string;
  id?: string;
  lines: 2 | 3;
  style?: CSSProperties;
  text: string;
};

function visiblePrefix(element: HTMLElement): string {
  const node = element.firstChild;
  const full = element.textContent ?? "";
  if (!node || node.nodeType !== Node.TEXT_NODE) return full;
  const text = node.textContent ?? "";
  const box = element.getBoundingClientRect();
  if (box.height === 0 || text.length === 0) return text;
  const range = document.createRange();
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    range.setStart(node, 0);
    range.setEnd(node, mid);
    const rects = range.getClientRects();
    const last = rects[rects.length - 1];
    const inside = !!last && last.bottom <= box.bottom + 1;
    if (inside) low = mid;
    else high = mid - 1;
  }
  return text.slice(0, low);
}

export function ClampedTitle({
  as: Tag = "h3",
  className = "",
  id,
  lines,
  style,
  text,
}: ClampedTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [collapsed, setCollapsed] = useState<string | null>(null);
  const clampClass = lines === 2 ? "line-clamp-2" : "line-clamp-3";

  useLayoutEffect(() => {
    const element = ref.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;

    const measure = () => {
      const probe = element.cloneNode(false) as HTMLElement;
      probe.className = `${className} ${clampClass}`;
      probe.textContent = text;
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      probe.style.width = `${element.clientWidth}px`;
      probe.style.height = "auto";
      probe.style.margin = "0";
      parent.appendChild(probe);
      const prefix = visiblePrefix(probe);
      probe.remove();
      const next = collapseCutoffEllipsis(prefix, text);
      setCollapsed((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [clampClass, className, text]);

  return (
    <Tag
      ref={ref}
      id={id}
      className={`${className} ${collapsed === null ? clampClass : ""}`}
      style={style}
    >
      {collapsed ?? text}
    </Tag>
  );
}
