import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset window scroll when the route path changes (e.g. home → /services). */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
}
