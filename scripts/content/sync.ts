import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { loadEnvFile } from "node:process";

import { getSyncConfiguration } from "./config.js";
import { fetchBeholdPosts } from "./providers/behold.js";
import { fetchSubstackPosts } from "./providers/substack.js";
import { synchronizeContent } from "./sync-service.js";
import type {
  ContentSource,
  SourceReconciliationStats,
} from "./types.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ARCHIVE_PATH = join(
  REPOSITORY_ROOT,
  "src",
  "data",
  "content-archive.json",
);

function loadLocalEnvironment(): void {
  try {
    loadEnvFile(join(REPOSITORY_ROOT, ".env"));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }
    throw error;
  }
}

function parseArguments(arguments_: string[]): { dryRun: boolean } {
  const unsupported = arguments_.filter((argument) => argument !== "--dry-run");
  if (unsupported.length > 0) {
    throw new Error(`Unknown argument: ${unsupported[0]}`);
  }
  return { dryRun: arguments_.includes("--dry-run") };
}

function printSourceSummary(
  label: string,
  stats: SourceReconciliationStats,
): void {
  console.log(`\n${label}:`);
  console.log(`  Fetched: ${stats.fetched}`);
  console.log(`  Added: ${stats.added}`);
  console.log(`  Updated: ${stats.updated}`);
  console.log(`  Unchanged: ${stats.unchanged}`);
  if (stats.duplicates > 0) {
    console.log(`  Duplicate records ignored: ${stats.duplicates}`);
  }
}

function sourceLabel(source: ContentSource): string {
  return source === "substack" ? "Substack" : "Instagram";
}

async function main(): Promise<void> {
  const { dryRun } = parseArguments(process.argv.slice(2));
  loadLocalEnvironment();

  // Validate private configuration before reading or modifying the archive and
  // before either provider makes a request.
  const configuration = getSyncConfiguration(process.env);

  console.log(
    dryRun
      ? "Synchronizing content (dry run)..."
      : "Synchronizing content...",
  );

  const result = await synchronizeContent({
    archivePath: ARCHIVE_PATH,
    dryRun,
    providers: [
      {
        source: "substack",
        fetchPosts: fetchSubstackPosts,
      },
      {
        source: "instagram",
        fetchPosts: () => fetchBeholdPosts(configuration.beholdFeedUrl),
      },
    ],
  });

  for (const source of ["substack", "instagram"] as const) {
    printSourceSummary(sourceLabel(source), result.stats.bySource[source]);
  }

  console.log("\nArchive:");
  console.log(`  Total records: ${result.stats.totalRecords}`);
  console.log(`  New: ${result.stats.totalAdded}`);
  console.log(`  Updated: ${result.stats.totalUpdated}`);
  console.log("  Removed: 0");

  if (!result.changed) {
    console.log("\nContent archive is already current.");
  } else if (dryRun) {
    console.log("\nDry run complete; the archive was not modified.");
  } else {
    console.log("\nContent archive updated.");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Content synchronization failed: ${message}`);
  process.exitCode = 1;
});
