import {
  readArchiveFile,
  serializeArchive,
  writeArchiveAtomic,
} from "./archive.js";
import { reconcile } from "./reconcile.js";
import { SubstackUnavailableError } from "./substack-fetch.js";
import type {
  ArchivePost,
  ContentArchive,
  ContentProvider,
  ContentSource,
  ReconciliationStats,
} from "./types.js";

export interface SynchronizeContentOptions {
  archivePath: string;
  dryRun: boolean;
  providers: ContentProvider[];
  readArchive?: (
    archivePath: string,
  ) => Promise<{ archive: ContentArchive; raw: string }>;
  writeArchive?: (
    archivePath: string,
    serializedArchive: string,
  ) => Promise<void>;
}

export interface SynchronizeContentResult {
  archive: ContentArchive;
  changed: boolean;
  dryRun: boolean;
  fetchedPostIds: ReadonlySet<string>;
  stats: ReconciliationStats;
  unavailableSources: ContentSource[];
  wroteArchive: boolean;
}

export async function synchronizeContent({
  archivePath,
  dryRun,
  providers,
  readArchive = readArchiveFile,
  writeArchive = writeArchiveAtomic,
}: SynchronizeContentOptions): Promise<SynchronizeContentResult> {
  const { archive: existingArchive, raw: existingRaw } =
    await readArchive(archivePath);

  const providerResults = await Promise.allSettled(
    providers.map(async (provider) => {
      try {
        const posts = await provider.fetchPosts();
        for (const post of posts) {
          if (post.source !== provider.source) {
            throw new Error(
              `${provider.source} provider returned a ${post.source} record.`,
            );
          }
        }
        return { posts, unavailable: false as const };
      } catch (error) {
        if (
          provider.source === "substack" &&
          error instanceof SubstackUnavailableError
        ) {
          return { posts: [] as ArchivePost[], unavailable: true as const };
        }
        throw error;
      }
    }),
  );

  const fatalErrors: unknown[] = [];
  const incomingPosts: ArchivePost[] = [];
  const unavailableSources: ContentSource[] = [];
  for (const result of providerResults) {
    if (result.status === "rejected") {
      fatalErrors.push(result.reason);
      continue;
    }
    if (result.value.unavailable) {
      unavailableSources.push("substack");
      continue;
    }
    incomingPosts.push(...result.value.posts);
  }
  if (fatalErrors.length === 1) {
    throw fatalErrors[0];
  }
  if (fatalErrors.length > 1) {
    throw new Error(
      fatalErrors
        .map((error) => (error instanceof Error ? error.message : String(error)))
        .join("; "),
    );
  }

  const { archive, stats } = reconcile(existingArchive, incomingPosts);
  const serializedArchive = serializeArchive(archive);
  const changed = serializedArchive !== existingRaw;

  if (changed && !dryRun) {
    await writeArchive(archivePath, serializedArchive);
  }

  return {
    archive,
    changed,
    dryRun,
    fetchedPostIds: new Set(incomingPosts.map((post) => post.id)),
    stats,
    unavailableSources,
    wroteArchive: changed && !dryRun,
  };
}
