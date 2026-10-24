import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { serializeArchive } from "../archive.js";
import { getSyncConfiguration } from "../config.js";
import { SubstackUnavailableError } from "../substack-fetch.js";
import { synchronizeContent } from "../sync-service.js";
import {
  emptyArchive,
  makeInstagramPost,
  makeSubstackPost,
} from "./test-helpers.js";

async function createTemporaryArchive(): Promise<{
  archivePath: string;
  cleanup: () => Promise<void>;
  original: string;
}> {
  const directory = await mkdtemp(join(tmpdir(), "everywoman-content-test-"));
  const archivePath = join(directory, "content-archive.json");
  const original = serializeArchive(emptyArchive());
  await writeFile(archivePath, original, "utf8");
  return {
    archivePath,
    original,
    cleanup: () => rm(directory, { force: true, recursive: true }),
  };
}

test("missing Behold configuration fails with an actionable error", () => {
  assert.throws(
    () => getSyncConfiguration({}),
    /Missing BEHOLD_FEED_URL\. Configure it in \.env or your execution environment\./,
  );
});

test("a provider failure leaves the archive untouched", async () => {
  const temporary = await createTemporaryArchive();
  try {
    await assert.rejects(
      synchronizeContent({
        archivePath: temporary.archivePath,
        dryRun: false,
        providers: [
          {
            source: "substack",
            fetchPosts: async () => [makeSubstackPost()],
          },
          {
            source: "instagram",
            fetchPosts: async () => {
              throw new Error("Provider unavailable");
            },
          },
        ],
      }),
      /Provider unavailable/,
    );

    assert.equal(
      await readFile(temporary.archivePath, "utf8"),
      temporary.original,
    );
  } finally {
    await temporary.cleanup();
  }
});

test("dry-run performs reconciliation without modifying the archive", async () => {
  const temporary = await createTemporaryArchive();
  try {
    const result = await synchronizeContent({
      archivePath: temporary.archivePath,
      dryRun: true,
      providers: [
        {
          source: "substack",
          fetchPosts: async () => [makeSubstackPost()],
        },
        {
          source: "instagram",
          fetchPosts: async () => [],
        },
      ],
    });

    assert.equal(result.changed, true);
    assert.equal(result.wroteArchive, false);
    assert.equal(result.stats.totalAdded, 1);
    assert.equal(
      await readFile(temporary.archivePath, "utf8"),
      temporary.original,
    );
  } finally {
    await temporary.cleanup();
  }
});

test("an identical synchronization does not rewrite the archive", async () => {
  const temporary = await createTemporaryArchive();
  const post = makeSubstackPost();
  const currentArchive = {
    ...emptyArchive(),
    posts: [post],
  };
  const currentRaw = serializeArchive(currentArchive);
  await writeFile(temporary.archivePath, currentRaw, "utf8");

  try {
    const result = await synchronizeContent({
      archivePath: temporary.archivePath,
      dryRun: false,
      providers: [
        {
          source: "substack",
          fetchPosts: async () => [structuredClone(post)],
        },
        {
          source: "instagram",
          fetchPosts: async () => [],
        },
      ],
    });

    assert.equal(result.changed, false);
    assert.equal(result.wroteArchive, false);
    assert.equal(await readFile(temporary.archivePath, "utf8"), currentRaw);
  } finally {
    await temporary.cleanup();
  }
});

test("a Substack outage preserves archived posts while Instagram is reconciled", async () => {
  const temporary = await createTemporaryArchive();
  const archived = makeSubstackPost();
  const instagram = makeInstagramPost();
  await writeFile(
    temporary.archivePath,
    serializeArchive({ ...emptyArchive(), posts: [archived] }),
    "utf8",
  );

  try {
    const result = await synchronizeContent({
      archivePath: temporary.archivePath,
      dryRun: false,
      providers: [
        {
          source: "substack",
          fetchPosts: async () => {
            throw new SubstackUnavailableError(
              "Substack feed unavailable after direct and proxy retries.",
              "proxy_exhausted",
              403,
            );
          },
        },
        {
          source: "instagram",
          fetchPosts: async () => [instagram],
        },
      ],
    });

    assert.deepEqual(result.unavailableSources, ["substack"]);
    assert.equal(result.wroteArchive, true);
    assert.equal(result.stats.bySource.substack.fetched, 0);
    assert.equal(result.stats.bySource.substack.added, 0);
    assert.equal(result.stats.bySource.instagram.added, 1);
    assert.deepEqual(
      result.archive.posts.find((post) => post.id === archived.id),
      archived,
    );
    assert.equal(
      result.archive.posts.some((post) => post.id === instagram.id),
      true,
    );
    assert.equal(
      await readFile(temporary.archivePath, "utf8"),
      serializeArchive(result.archive),
    );
  } finally {
    await temporary.cleanup();
  }
});

test("an empty Substack fetch is not treated as an outage", async () => {
  const temporary = await createTemporaryArchive();
  const archived = makeSubstackPost();
  const original = serializeArchive({ ...emptyArchive(), posts: [archived] });
  await writeFile(temporary.archivePath, original, "utf8");

  try {
    const result = await synchronizeContent({
      archivePath: temporary.archivePath,
      dryRun: false,
      providers: [
        {
          source: "substack",
          fetchPosts: async () => [],
        },
        {
          source: "instagram",
          fetchPosts: async () => [],
        },
      ],
    });

    assert.deepEqual(result.unavailableSources, []);
    assert.equal(result.changed, false);
    assert.equal(result.wroteArchive, false);
    assert.deepEqual(result.archive.posts, [archived]);
    assert.equal(await readFile(temporary.archivePath, "utf8"), original);
  } finally {
    await temporary.cleanup();
  }
});

test("a TikTok provider failure leaves the archive untouched", async () => {
  const temporary = await createTemporaryArchive();
  try {
    await assert.rejects(
      synchronizeContent({
        archivePath: temporary.archivePath,
        dryRun: false,
        providers: [
          {
            source: "substack",
            fetchPosts: async () => [makeSubstackPost()],
          },
          {
            source: "tiktok",
            fetchPosts: async () => {
              throw new Error("TikTok dataset expired");
            },
          },
        ],
      }),
      /TikTok dataset expired/,
    );

    assert.equal(
      await readFile(temporary.archivePath, "utf8"),
      temporary.original,
    );
  } finally {
    await temporary.cleanup();
  }
});

test("a Substack feed-shape error still aborts before writing", async () => {
  const temporary = await createTemporaryArchive();
  const archived = makeSubstackPost();
  const original = serializeArchive({ ...emptyArchive(), posts: [archived] });
  await writeFile(temporary.archivePath, original, "utf8");

  try {
    await assert.rejects(
      synchronizeContent({
        archivePath: temporary.archivePath,
        dryRun: false,
        providers: [
          {
            source: "substack",
            fetchPosts: async () => {
              throw new Error(
                "Invalid Substack feed: item has no content:encoded body.",
              );
            },
          },
          {
            source: "instagram",
            fetchPosts: async () => [makeInstagramPost()],
          },
        ],
      }),
      /no content:encoded body/,
    );

    assert.equal(await readFile(temporary.archivePath, "utf8"), original);
  } finally {
    await temporary.cleanup();
  }
});

test("a Substack outage does not commit when Instagram also fails", async () => {
  const temporary = await createTemporaryArchive();
  try {
    await assert.rejects(
      synchronizeContent({
        archivePath: temporary.archivePath,
        dryRun: false,
        providers: [
          {
            source: "substack",
            fetchPosts: async () => {
              throw new SubstackUnavailableError(
                "Substack feed unavailable after direct and proxy retries.",
                "proxy_exhausted",
                403,
              );
            },
          },
          {
            source: "instagram",
            fetchPosts: async () => {
              throw new Error("Provider unavailable");
            },
          },
        ],
      }),
      /Provider unavailable/,
    );

    assert.equal(
      await readFile(temporary.archivePath, "utf8"),
      temporary.original,
    );
  } finally {
    await temporary.cleanup();
  }
});

test("a successful non-dry run writes the reconciled archive once", async () => {
  const temporary = await createTemporaryArchive();
  try {
    const result = await synchronizeContent({
      archivePath: temporary.archivePath,
      dryRun: false,
      providers: [
        {
          source: "substack",
          fetchPosts: async () => [makeSubstackPost()],
        },
        {
          source: "instagram",
          fetchPosts: async () => [],
        },
      ],
    });

    assert.equal(result.wroteArchive, true);
    assert.equal(
      await readFile(temporary.archivePath, "utf8"),
      serializeArchive(result.archive),
    );
  } finally {
    await temporary.cleanup();
  }
});
