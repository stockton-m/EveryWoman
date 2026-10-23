import path from "node:path";
import type { Plugin } from "vite";

import {
  closeExperimentalParser,
  isExperimentalFile,
  stripExperimentalImports,
  withExperimentalSourceExclusions,
} from "./strip.ts";

const SOURCE_FILE = /\.(tsx?|jsx?|mts|cts)$/;

function diskPath(id: string): string | null {
  const file = id.split("?")[0]?.split("#")[0] ?? "";
  if (!path.isAbsolute(file) || file.includes("\0")) return null;
  return file;
}

function inNodeModules(file: string): boolean {
  return file.split(path.sep).includes("node_modules");
}

export function experimentalContentPlugin({ include }: { include: boolean }): Plugin {
  if (include) return { name: "experimental-content" };

  let root = process.cwd();
  let tailwindCss = path.join(root, "src", "styles", "tailwind.css");

  return {
    name: "experimental-content",
    enforce: "pre",
    configResolved(config) {
      root = config.root;
      tailwindCss = path.join(root, "src", "styles", "tailwind.css");
    },
    load(id) {
      const file = diskPath(id);
      if (!file || inNodeModules(file) || !SOURCE_FILE.test(file) || !isExperimentalFile(file)) {
        return null;
      }
      return "export {}\n";
    },
    transform(code, id) {
      const file = diskPath(id);
      if (!file || inNodeModules(file)) return null;
      if (path.resolve(file) === path.resolve(tailwindCss)) {
        const next = withExperimentalSourceExclusions(code, root, file);
        return next === code ? null : { code: next, map: null };
      }
      if (!SOURCE_FILE.test(file)) return null;
      const next = stripExperimentalImports(code, file, root);
      return next === code ? null : { code: next, map: null };
    },
    buildEnd() {
      closeExperimentalParser();
    },
  };
}
