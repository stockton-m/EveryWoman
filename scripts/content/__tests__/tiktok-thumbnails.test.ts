import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { assertArchivePost, serializeArchive } from "../archive.js";
import { downloadMissingTikTokThumbnails } from "../tiktok-thumbnails.js";
import type { ContentArchive } from "../types.js";
import { emptyArchive, makeInstagramPost, makeTikTokPost } from "./test-helpers.js";

const SIGNED_THUMBNAIL_URL =
  "https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/cover.image?x-expires=1791820800&x-signature=abc";
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 0xd9]);
const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function archiveWith(
  ...posts: ContentArchive["posts"]
): ContentArchive {
  return {
    ...emptyArchive(),
    posts,
  };
}

async function temporaryDirectory(): Promise<string> {
  return mkdtemp(join(tmpdir(), "tiktok-thumbnails-"));
}

test("a new TikTok thumbnail is saved under the archive source id", async () => {
  const directory = await temporaryDirectory();
  const warnings: string[] = [];
  const requests: string[] = [];
  const post = makeTikTokPost();
  const instagram = makeInstagramPost();

  try {
    const result = await downloadMissingTikTokThumbnails({
      archive: archiveWith(instagram, post),
      thumbnailDirectory: directory,
      warn: (message) => warnings.push(message),
      fetchImpl: async (input) => {
        const url = requestUrl(input);
        requests.push(url);
        if (url.startsWith("https://www.tiktok.com/oembed")) {
          assert.equal(
            new URL(url).searchParams.get("url"),
            post.sourceUrl,
          );
          return new Response(
            JSON.stringify({
              thumbnail_url: SIGNED_THUMBNAIL_URL,
              title: post.metadata.caption,
            }),
          );
        }
        assert.equal(url, SIGNED_THUMBNAIL_URL);
        return new Response(JPEG);
      },
    });

    const saved = result.archive.posts.find((item) => item.id === post.id);
    assert.equal(result.downloaded, 1);
    assert.equal(result.failed, 0);
    assert.equal(warnings.length, 0);
    assert.equal(
      saved?.source === "tiktok" ? saved.metadata.thumbnailPath : undefined,
      "tiktok/7685236720534637837.jpg",
    );
    assert.deepEqual(saved?.media, []);
    assert.deepEqual(
      await readFile(join(directory, "7685236720534637837.jpg")),
      Buffer.from(JPEG),
    );

    const serialized = serializeArchive(result.archive);
    assert.doesNotMatch(serialized, /x-expires|x-signature|tiktokcdn/);
    assert.equal(
      result.archive.posts.find((item) => item.source === "instagram"),
      instagram,
    );

    const beforeRewrite = await stat(
      join(directory, "7685236720534637837.jpg"),
    );
    const rewritten = await downloadMissingTikTokThumbnails({
      archive: result.archive,
      thumbnailDirectory: directory,
      fetchImpl: async () => {
        throw new Error("thumbnail refresh was attempted");
      },
    });
    const afterRewrite = await stat(
      join(directory, "7685236720534637837.jpg"),
    );
    assert.equal(rewritten.downloaded, 0);
    assert.equal(rewritten.skipped, 1);
    assert.equal(rewritten.failed, 0);
    assert.equal(serializeArchive(rewritten.archive), serialized);
    assert.equal(beforeRewrite.mtimeMs, afterRewrite.mtimeMs);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("png thumbnails use a png extension", async () => {
  const directory = await temporaryDirectory();
  const post = makeTikTokPost();

  try {
    const result = await downloadMissingTikTokThumbnails({
      archive: archiveWith(post),
      thumbnailDirectory: directory,
      fetchImpl: async (input) => {
        const url = requestUrl(input);
        if (url.startsWith("https://www.tiktok.com/oembed")) {
          return new Response(
            JSON.stringify({ thumbnail_url: "https://cdn.example.com/cover.png" }),
          );
        }
        return new Response(PNG);
      },
    });

    assert.equal(
      result.archive.posts[0]?.source === "tiktok"
        ? result.archive.posts[0].metadata.thumbnailPath
        : undefined,
      "tiktok/7685236720534637837.png",
    );
    assert.deepEqual(
      await readFile(join(directory, "7685236720534637837.png")),
      Buffer.from(PNG),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("posts that already have a thumbnail are not downloaded again", async () => {
  const directory = await temporaryDirectory();
  const relativeName = "7685236720534637837.jpg";
  const post = makeTikTokPost({
    metadata: {
      author: "everywomanhealth",
      thumbnailPath: `tiktok/${relativeName}`,
    },
  });
  const requests: string[] = [];

  try {
    await writeFile(join(directory, relativeName), Buffer.from("saved-once"));
    const before = await stat(join(directory, relativeName));
    const result = await downloadMissingTikTokThumbnails({
      archive: archiveWith(post),
      thumbnailDirectory: directory,
      fetchImpl: async (input) => {
        requests.push(requestUrl(input));
        throw new Error("thumbnail refresh was attempted");
      },
    });
    const after = await stat(join(directory, relativeName));

    assert.deepEqual(requests, []);
    assert.equal(result.skipped, 1);
    assert.equal(result.downloaded, 0);
    assert.equal(after.mtimeMs, before.mtimeMs);
    assert.equal(
      await readFile(join(directory, relativeName), "utf8"),
      "saved-once",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("missing, failed, and non-image thumbnails leave the post unchanged", async () => {
  const directory = await temporaryDirectory();
  const warnings: string[] = [];
  const missing = makeTikTokPost();
  const failed = makeTikTokPost({
    sourceId: "7679505235156503821",
    sourceUrl:
      "https://www.tiktok.com/@everywomanhealth/video/7679505235156503821",
  });
  const notImage = makeTikTokPost({
    sourceId: "7678016627786534157",
    sourceUrl:
      "https://www.tiktok.com/@everywomanhealth/video/7678016627786534157",
  });
  const saved = makeTikTokPost({
    sourceId: "7644211611959348493",
    sourceUrl:
      "https://www.tiktok.com/@everywomanhealth/video/7644211611959348493",
  });

  try {
    const result = await downloadMissingTikTokThumbnails({
      archive: archiveWith(missing, failed, notImage, saved),
      thumbnailDirectory: directory,
      warn: (message) => warnings.push(message),
      fetchImpl: async (input) => {
        const url = requestUrl(input);
        if (url.startsWith("https://www.tiktok.com/oembed")) {
          const videoUrl = new URL(url).searchParams.get("url") ?? "";
          if (videoUrl.includes(missing.sourceId)) {
            return new Response(JSON.stringify({ title: "no image" }));
          }
          if (videoUrl.includes(failed.sourceId)) {
            return new Response(SIGNED_THUMBNAIL_URL, { status: 404 });
          }
          if (videoUrl.includes(notImage.sourceId)) {
            return new Response(
              JSON.stringify({ thumbnail_url: SIGNED_THUMBNAIL_URL }),
            );
          }
          return new Response(
            JSON.stringify({ thumbnail_url: "https://cdn.example.com/ok.jpg" }),
          );
        }
        if (url === SIGNED_THUMBNAIL_URL) {
          return new Response("not an image");
        }
        return new Response(JPEG);
      },
    });

    assert.equal(result.downloaded, 1);
    assert.equal(result.failed, 3);
    assert.equal(
      result.archive.posts.find((post) => post.id === missing.id),
      missing,
    );
    assert.equal(
      result.archive.posts.find((post) => post.id === failed.id),
      failed,
    );
    assert.equal(
      result.archive.posts.find((post) => post.id === notImage.id),
      notImage,
    );
    assert.equal(
      result.archive.posts.find((post) => post.id === saved.id)?.source ===
        "tiktok"
        ? (
            result.archive.posts.find((post) => post.id === saved.id) as {
              metadata: { thumbnailPath?: string };
            }
          ).metadata.thumbnailPath
        : undefined,
      "tiktok/7644211611959348493.jpg",
    );
    assert.equal(warnings.length, 3);
    assert.ok(warnings.every((warning) => !warning.includes("x-expires")));
    assert.ok(warnings.every((warning) => !warning.includes("x-signature")));
    await assert.rejects(stat(join(directory, `${missing.sourceId}.jpg`)));
    await assert.rejects(stat(join(directory, `${notImage.sourceId}.jpg`)));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("thumbnail paths must match the archived source id", () => {
  const metadata = {
    author: "everywomanhealth",
    thumbnailPath: "https://cdn.example.com/cover.jpg?x-expires=1",
  };
  assert.throws(
    () => assertArchivePost(makeTikTokPost({ metadata })),
    /thumbnailPath/,
  );
  assert.doesNotThrow(() =>
    assertArchivePost(
      makeTikTokPost({
        metadata: {
          author: "everywomanhealth",
          thumbnailPath: "tiktok/7685236720534637837.jpg",
        },
      }),
    ),
  );
});
