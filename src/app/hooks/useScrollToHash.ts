import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (pathname !== "/" || !hash) return;

    const id = hash.replace("#", "");
    const scroll = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

    // Wait for layout after route change
    const t = window.setTimeout(scroll, 0);
    return () => window.clearTimeout(t);
  }, [hash, pathname]);
}
