import assert from "node:assert/strict";
import { test } from "node:test";

import { parseViteCommand } from "../cli.ts";

test("parseViteCommand omits experimental content unless the flag is present", () => {
  assert.deepEqual(parseViteCommand(["build"]), {
    command: "build",
    includeExperimental: false,
    viteArgs: [],
  });
  assert.deepEqual(parseViteCommand(["build", "--sourcemap"]), {
    command: "build",
    includeExperimental: false,
    viteArgs: ["--sourcemap"],
  });
  assert.deepEqual(parseViteCommand(["dev", "-e", "--host", "--port", "5173"]), {
    command: "dev",
    includeExperimental: true,
    viteArgs: ["--host", "--port", "5173"],
  });
  assert.deepEqual(parseViteCommand(["build", "--include-experimental-content"]), {
    command: "build",
    includeExperimental: true,
    viteArgs: [],
  });
});
