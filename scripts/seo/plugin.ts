import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

import { writeSeoBuild } from "./generate.ts";
import {
  applySeo,
  articlesFromArchive,
  indexablePages,
  pageForPath,
  renderLlmsTxt,
  renderSitemap,
  type ArchiveInput,
  type SeoArticle,
} from "../../src/app/seo/metadata.ts";

export function seoPlugins(): Plugin[] {
  let root = process.cwd();
  let outDir = path.resolve(process.cwd(), "dist");
  let articles: SeoArticle[] | undefined;

  function loadArticles(): SeoArticle[] {
    if (!articles) {
      const archive = JSON.parse(
        fs.readFileSync(path.join(root, "src/data/content-archive.json"), "utf8"),
      ) as ArchiveInput;
      articles = articlesFromArchive(archive);
    }
    return articles;
  }

  return [
    {
      name: "everywoman-seo-config",
      configResolved(config) {
        root = config.root;
        outDir = path.resolve(config.root, config.build.outDir);
      },
    },
    {
      name: "everywoman-seo-dev",
      apply: "serve",
      transformIndexHtml: {
        order: "pre",
        handler(html, ctx) {
          return applySeo(html, pageForPath(ctx.originalUrl ?? "/", loadArticles()));
        },
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split("?")[0];
          if (url === "/sitemap.xml") {
            res.setHeader("Content-Type", "application/xml; charset=utf-8");
            res.end(renderSitemap(indexablePages(loadArticles())));
            return;
          }
          if (url === "/llms.txt") {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(renderLlmsTxt(loadArticles()));
            return;
          }
          next();
        });
      },
    },
    {
      name: "everywoman-seo-build",
      apply: "build",
      closeBundle() {
        const htmlPath = path.join(outDir, "index.html");
        if (!fs.existsSync(htmlPath)) {
          throw new Error("SEO build could not find dist/index.html");
        }
        const archive = JSON.parse(
          fs.readFileSync(path.join(root, "src/data/content-archive.json"), "utf8"),
        ) as ArchiveInput;
        writeSeoBuild({
          archive,
          html: fs.readFileSync(htmlPath, "utf8"),
          outDir,
        });
      },
    },
  ];
}
