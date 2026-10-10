const TRAILING_ELLIPSIS = /(?:\.{3}|…)[.\u2026]*$/;

/** If a clamped title already ends in an ellipsis, keep one instead of painting another. */
export function collapseCutoffEllipsis(
  visiblePrefix: string,
  fullText: string,
): string | null {
  const trimmed = visiblePrefix.trimEnd();
  const full = fullText.trimEnd();
  if (trimmed.length >= full.length) return null;
  if (!TRAILING_ELLIPSIS.test(trimmed)) return null;
  return trimmed.replace(TRAILING_ELLIPSIS, "…");
}
