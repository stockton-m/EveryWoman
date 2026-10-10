import {
  readArchiveFile,
  serializeArchive,
  writeArchiveAtomic,
} from "./archive.js";
import { reconcile } from "./reconcile.js";
import type {
  ContentArchive,
  ContentProvider,
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
  stats: ReconciliationStats;
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

  const providerResults = await Promise.all(
    providers.map(async (provider) => {
      const posts = await provider.fetchPosts();
      for (const post of posts) {
        if (post.source !== provider.source) {
          throw new Error(
            `${provider.source} provider returned a ${post.source} record.`,
          );
        }
      }
      return posts;
    }),
  );

  const { archive, stats } = reconcile(
    existingArchive,
    providerResults.flat(),
  );
  const serializedArchive = serializeArchive(archive);
  const changed = serializedArchive !== existingRaw;

  if (changed && !dryRun) {
    await writeArchive(archivePath, serializedArchive);
  }

  return {
    archive,
    changed,
    dryRun,
    stats,
    wroteArchive: changed && !dryRun,
  };
}
