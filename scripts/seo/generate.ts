import fs from "node:fs";
import path from "node:path";

import {
  applySeo,
  articlesFromArchive,
  indexablePages,
  notFoundPage,
  renderLlmsTxt,
  renderSitemap,
  type ArchiveInput,
} from "../../src/app/seo/metadata.ts";

export function writeSeoBuild(options: {
  archive: ArchiveInput;
  html: string;
  outDir: string;
}): void {
  const articles = articlesFromArchive(options.archive);
  const pages = indexablePages(articles);

  for (const page of pages) {
    const filePath = htmlOutputPath(options.outDir, page.path);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, applySeo(options.html, page));
  }

  fs.writeFileSync(
    path.join(options.outDir, "404.html"),
    applySeo(options.html, notFoundPage()),
  );
  fs.writeFileSync(path.join(options.outDir, "sitemap.xml"), renderSitemap(pages));
  fs.writeFileSync(path.join(options.outDir, "llms.txt"), renderLlmsTxt(articles));
}

function htmlOutputPath(outDir: string, pagePath: string): string {
  if (pagePath === "/") return path.join(outDir, "index.html");
  return path.join(outDir, pagePath.slice(1), "index.html");
}
