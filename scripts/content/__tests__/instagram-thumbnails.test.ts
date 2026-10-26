import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { assertArchivePost, serializeArchive } from "../archive.js";
import {
  downloadMissingInstagramThumbnails,
  instagramPostsMissingThumbnails,
} from "../instagram-thumbnails.js";
import type { ContentArchive, InstagramPost } from "../types.js";
import { emptyArchive, makeInstagramPost, makeTikTokPost } from "./test-helpers.js";

const SOURCE_ID = "17975907045137523";
const MEDIUM_URL = "https://behold.pictures/cover.jpg?class=originalMedium";
const THUMBNAIL_URL = "https://cdn.example.com/thumb.jpg";
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

function archiveWith(...posts: ContentArchive["posts"]): ContentArchive {
  return {
    ...emptyArchive(),
    posts,
  };
}

function instagramPost(
  overrides: Partial<InstagramPost> = {},
): InstagramPost {
  const sourceId = overrides.sourceId ?? SOURCE_ID;
  return makeInstagramPost({
    sourceId,
    media: [
      {
        id: sourceId,
        mediaType: "VIDEO",
        mediaUrl: "https://cdn.example.com/video.mp4",
        thumbnailUrl: THUMBNAIL_URL,
        sizes: {
          medium: {
            mediaUrl: MEDIUM_URL,
            width: 394,
            height: 700,
          },
        },
      },
    ],
    ...overrides,
  });
}

async function temporaryDirectory(): Promise<string> {
  return mkdtemp(join(tmpdir(), "instagram-thumbnails-"));
}

test("a new Instagram thumbnail is saved from the Behold cover URL", async () => {
  const directory = await temporaryDirectory();
  const warnings: string[] = [];
  const requests: string[] = [];
  const post = instagramPost();
  const tiktok = makeTikTokPost();

  try {
    const result = await downloadMissingInstagramThumbnails({
      archive: archiveWith(tiktok, post),
      thumbnailDirectory: directory,
      warn: (message) => warnings.push(message),
      fetchImpl: async (input) => {
        requests.push(requestUrl(input));
        return new Response(JPEG);
      },
    });

    const saved = result.archive.posts.find((item) => item.id === post.id);
    assert.deepEqual(requests, [MEDIUM_URL]);
    assert.equal(result.downloaded, 1);
    assert.equal(result.failed, 0);
    assert.equal(warnings.length, 0);
    assert.equal(
      saved?.source === "instagram" ? saved.metadata.thumbnailPath : undefined,
      `instagram/${SOURCE_ID}.jpg`,
    );
    assert.deepEqual(
      await readFile(join(directory, `${SOURCE_ID}.jpg`)),
      Buffer.from(JPEG),
    );
    assert.equal(
      result.archive.posts.find((item) => item.source === "tiktok"),
      tiktok,
    );

    const serialized = serializeArchive(result.archive);
    const beforeRewrite = await stat(join(directory, `${SOURCE_ID}.jpg`));
    const rewritten = await downloadMissingInstagramThumbnails({
      archive: result.archive,
      thumbnailDirectory: directory,
      fetchImpl: async () => {
        throw new Error("thumbnail refresh was attempted");
      },
    });
    const afterRewrite = await stat(join(directory, `${SOURCE_ID}.jpg`));
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
  const post = instagramPost();

  try {
    const result = await downloadMissingInstagramThumbnails({
      archive: archiveWith(post),
      thumbnailDirectory: directory,
      fetchImpl: async () => new Response(PNG),
    });

    assert.equal(
      result.archive.posts[0]?.source === "instagram"
        ? result.archive.posts[0].metadata.thumbnailPath
        : undefined,
      `instagram/${SOURCE_ID}.png`,
    );
    assert.deepEqual(
      await readFile(join(directory, `${SOURCE_ID}.png`)),
      Buffer.from(PNG),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("posts that already have a thumbnail are not downloaded again", async () => {
  const directory = await temporaryDirectory();
  const relativeName = `${SOURCE_ID}.jpg`;
  const post = instagramPost({
    metadata: {
      mediaType: "VIDEO",
      thumbnailPath: `instagram/${relativeName}`,
    },
  });
  const requests: string[] = [];

  try {
    await writeFile(join(directory, relativeName), Buffer.from("saved-once"));
    const before = await stat(join(directory, relativeName));
    const result = await downloadMissingInstagramThumbnails({
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

test("posts without a cover URL are left unchanged", async () => {
  const directory = await temporaryDirectory();
  const requests: string[] = [];
  const post = makeInstagramPost({
    sourceId: SOURCE_ID,
    media: [
      {
        id: SOURCE_ID,
        mediaType: "VIDEO",
        mediaUrl: "https://cdn.example.com/video.mp4",
      },
    ],
  });

  try {
    const result = await downloadMissingInstagramThumbnails({
      archive: archiveWith(post),
      thumbnailDirectory: directory,
      fetchImpl: async (input) => {
        requests.push(requestUrl(input));
        return new Response(JPEG);
      },
    });

    assert.deepEqual(requests, []);
    assert.equal(result.downloaded, 0);
    assert.equal(result.failed, 0);
    assert.equal(result.skipped, 1);
    assert.equal(result.archive.posts[0], post);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a carousel uses the first child cover when the album has none", async () => {
  const directory = await temporaryDirectory();
  const childUrl = "https://behold.pictures/child.jpg?class=originalMedium";
  const post = makeInstagramPost({
    sourceId: SOURCE_ID,
    media: [
      {
        id: SOURCE_ID,
        mediaType: "CAROUSEL_ALBUM",
        mediaUrl: "https://cdn.example.com/album.mp4",
        children: [
          {
            id: "17921438979141955",
            mediaType: "IMAGE",
            mediaUrl: "https://cdn.example.com/child-full.jpg",
            sizes: {
              medium: {
                mediaUrl: childUrl,
                width: 560,
                height: 700,
              },
            },
          },
        ],
      },
    ],
  });
  const requests: string[] = [];

  try {
    const result = await downloadMissingInstagramThumbnails({
      archive: archiveWith(post),
      thumbnailDirectory: directory,
      fetchImpl: async (input) => {
        requests.push(requestUrl(input));
        return new Response(JPEG);
      },
    });

    assert.deepEqual(requests, [childUrl]);
    assert.equal(
      result.archive.posts[0]?.source === "instagram"
        ? result.archive.posts[0].metadata.thumbnailPath
        : undefined,
      `instagram/${SOURCE_ID}.jpg`,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("an image media URL is saved when sizes and thumbnailUrl are absent", async () => {
  const directory = await temporaryDirectory();
  const imageUrl = "https://cdn.example.com/image.jpg";
  const post = makeInstagramPost({
    sourceId: SOURCE_ID,
    media: [
      {
        id: SOURCE_ID,
        mediaType: "IMAGE",
        mediaUrl: imageUrl,
      },
    ],
  });
  const requests: string[] = [];

  try {
    await downloadMissingInstagramThumbnails({
      archive: archiveWith(post),
      thumbnailDirectory: directory,
      fetchImpl: async (input) => {
        requests.push(requestUrl(input));
        return new Response(JPEG);
      },
    });
    assert.deepEqual(requests, [imageUrl]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("posts absent from the current Behold fetch are not downloaded", async () => {
  const directory = await temporaryDirectory();
  const requests: string[] = [];
  const current = instagramPost();
  const archived = instagramPost({
    sourceId: "17877676845657973",
    media: [
      {
        id: "17877676845657973",
        mediaType: "IMAGE",
        mediaUrl: "https://behold.pictures/old.jpg?class=originalMedium",
      },
    ],
  });
  const archive = archiveWith(current, archived);

  try {
    assert.deepEqual(
      instagramPostsMissingThumbnails(archive, new Set([current.id])).map(
        (post) => post.id,
      ),
      [current.id],
    );
    const result = await downloadMissingInstagramThumbnails({
      archive,
      eligibleIds: new Set([current.id]),
      thumbnailDirectory: directory,
      fetchImpl: async (input) => {
        requests.push(requestUrl(input));
        return new Response(JPEG);
      },
    });

    assert.deepEqual(requests, [MEDIUM_URL]);
    assert.equal(result.downloaded, 1);
    assert.equal(result.failed, 0);
    assert.equal(result.skipped, 1);
    assert.equal(result.archive.posts[1], archived);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("failed and non-image thumbnails leave the post unchanged", async () => {
  const directory = await temporaryDirectory();
  const warnings: string[] = [];
  const failed = instagramPost();
  const notImage = instagramPost({
    sourceId: "17887105872621303",
    media: [
      {
        id: "17887105872621303",
        mediaType: "IMAGE",
        mediaUrl: "https://cdn.example.com/plain.jpg",
      },
    ],
  });

  try {
    const result = await downloadMissingInstagramThumbnails({
      archive: archiveWith(failed, notImage),
      thumbnailDirectory: directory,
      warn: (message) => warnings.push(message),
      fetchImpl: async (input) => {
        const url = requestUrl(input);
        if (url === MEDIUM_URL) {
          return new Response("missing", { status: 400 });
        }
        return new Response("not an image");
      },
    });

    assert.equal(result.downloaded, 0);
    assert.equal(result.failed, 2);
    assert.equal(result.archive.posts[0], failed);
    assert.equal(result.archive.posts[1], notImage);
    assert.equal(warnings.length, 2);
    assert.match(warnings[0] ?? "", /HTTP 400/);
    assert.match(warnings[1] ?? "", /JPEG, PNG, or WebP/);
    await assert.rejects(stat(join(directory, `${failed.sourceId}.jpg`)));
    await assert.rejects(stat(join(directory, `${notImage.sourceId}.jpg`)));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("thumbnail paths must match the archived source id", () => {
  assert.throws(
    () =>
      assertArchivePost(
        makeInstagramPost({
          sourceId: SOURCE_ID,
          metadata: {
            mediaType: "IMAGE",
            thumbnailPath: "https://cdn.example.com/cover.jpg?oe=1",
          },
        }),
      ),
    /thumbnailPath/,
  );
  assert.throws(
    () =>
      assertArchivePost(
        makeInstagramPost({
          sourceId: SOURCE_ID,
          metadata: {
            mediaType: "IMAGE",
            thumbnailPath: "tiktok/17975907045137523.jpg",
          },
        }),
      ),
    /thumbnailPath/,
  );
  assert.doesNotThrow(() =>
    assertArchivePost(
      makeInstagramPost({
        sourceId: SOURCE_ID,
        metadata: {
          mediaType: "IMAGE",
          thumbnailPath: `instagram/${SOURCE_ID}.jpg`,
        },
      }),
    ),
  );
});
