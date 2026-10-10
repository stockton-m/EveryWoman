import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { findSubstackPost } from "@/app/content/posts";
import { slugFromPath, titleForPath } from "@/app/seo/metadata";

export function PageTitle() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const slug = slugFromPath(pathname);
    const article = slug ? findSubstackPost(slug) : undefined;
    document.title = titleForPath(pathname, article?.title);
  }, [pathname]);

  return null;
}
