import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

import { readExperimentalContentFlag } from "./experimental/args.ts";

export type ViteCommand = {
  command: "dev" | "build";
  includeExperimental: boolean;
  viteArgs: string[];
};

export function parseViteCommand(argv: string[]): ViteCommand {
  const [command, ...rest] = argv;
  if (command !== "dev" && command !== "build") {
    throw new Error(`Expected dev or build, received ${command ?? "nothing"}`);
  }
  const experimental = readExperimentalContentFlag(rest);
  return {
    command,
    includeExperimental: experimental.include,
    viteArgs: experimental.args,
  };
}

function launchedAsCli(): boolean {
  const entry = process.argv[1] ?? "";
  return entry.endsWith(`${path.sep}cli.ts`) || entry.endsWith(`${path.sep}cli.js`);
}

function runVite(parsed: ViteCommand): void {
  const require = createRequire(import.meta.url);
  const vitePackage = require.resolve("vite/package.json");
  const viteBin = path.join(path.dirname(vitePackage), "bin", "vite.js");
  const child = spawn(
    process.execPath,
    [viteBin, ...(parsed.command === "build" ? ["build"] : []), ...parsed.viteArgs],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        INCLUDE_EXPERIMENTAL_CONTENT: parsed.includeExperimental ? "true" : "false",
      },
    },
  );

  child.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

if (launchedAsCli()) {
  try {
    runVite(parseViteCommand(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
