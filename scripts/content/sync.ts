import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { loadEnvFile } from "node:process";

import { serializeArchive, writeArchiveAtomic } from "./archive.js";
import { getSyncConfiguration } from "./config.js";
import { fetchBeholdPosts } from "./providers/behold.js";
import { fetchSubstackPosts } from "./providers/substack.js";
import { fetchTikTokPosts } from "./providers/tiktok.js";
import { synchronizeContent } from "./sync-service.js";
import {
  downloadMissingTikTokThumbnails,
  tiktokPostsMissingThumbnails,
} from "./tiktok-thumbnails.js";
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
const TIKTOK_THUMBNAIL_DIRECTORY = join(REPOSITORY_ROOT, "public", "tiktok");

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
  switch (source) {
    case "substack":
      return "Substack";
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
  }
}

async function main(): Promise<void> {
  const { dryRun } = parseArguments(process.argv.slice(2));
  loadLocalEnvironment();

  // Validate private configuration before reading or modifying the archive and
  // before any provider makes a request.
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
      {
        source: "tiktok",
        fetchPosts: () =>
          fetchTikTokPosts({
            taskId: configuration.apifyTaskId,
            token: configuration.apifyToken,
          }),
      },
    ],
  });

  for (const source of ["substack", "instagram", "tiktok"] as const) {
    printSourceSummary(sourceLabel(source), result.stats.bySource[source]);
  }

  console.log("\nArchive:");
  console.log(`  Total records: ${result.stats.totalRecords}`);
  console.log(`  New: ${result.stats.totalAdded}`);
  console.log(`  Updated: ${result.stats.totalUpdated}`);
  console.log("  Removed: 0");

  const missingThumbnails = tiktokPostsMissingThumbnails(result.archive);
  let thumbnailsWritten = false;
  if (dryRun) {
    console.log(
      `\nTikTok thumbnails: ${missingThumbnails.length} posts still need a thumbnail. Dry run did not download them.`,
    );
  } else if (missingThumbnails.length === 0) {
    console.log("\nTikTok thumbnails are already saved.");
  } else {
    console.log(
      `\nTikTok thumbnails: found ${missingThumbnails.length} posts without a thumbnail. Downloading them now (this may take a few seconds)...`,
    );
    const thumbnails = await downloadMissingTikTokThumbnails({
      archive: result.archive,
      thumbnailDirectory: TIKTOK_THUMBNAIL_DIRECTORY,
    });
    const serializedArchive = serializeArchive(thumbnails.archive);
    if (serializedArchive !== serializeArchive(result.archive)) {
      await writeArchiveAtomic(ARCHIVE_PATH, serializedArchive);
      thumbnailsWritten = true;
    }
    console.log(
      `\nTikTok thumbnails: downloaded ${thumbnails.downloaded}, failed ${thumbnails.failed}.`,
    );
  }

  if (dryRun) {
    console.log(
      result.changed
        ? "\nDry run complete; the archive was not modified."
        : "\nContent archive is already current.",
    );
  } else if (result.changed || thumbnailsWritten) {
    console.log("\nContent archive updated.");
  } else {
    console.log("\nContent archive is already current.");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Content synchronization failed: ${message}`);
  process.exitCode = 1;
});
