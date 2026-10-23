import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  fetchBeholdPosts,
  parseBeholdFeed,
  validateBeholdFeedUrl,
} from "../providers/behold.js";

const FIXTURE_URL = new URL("../fixtures/behold.json", import.meta.url);

test("Behold video metadata and optimized images are retained", async () => {
  const fixture = JSON.parse(await readFile(FIXTURE_URL, "utf8")) as unknown;
  const posts = parseBeholdFeed(fixture);
  const video = posts.find((post) => post.sourceId === "video-123");

  assert.ok(video);
  assert.equal(video.publishedAt, "2026-09-21T10:30:00.000Z");
  assert.equal(video.metadata.mediaType, "VIDEO");
  assert.equal(video.metadata.isReel, true);
  assert.equal(video.metadata.caption, "A reel caption #strength");
  assert.equal(video.metadata.prunedCaption, "A reel caption");
  assert.deepEqual(video.metadata.hashtags, ["strength"]);
  assert.equal(video.metadata.likeCount, 24);
  assert.equal(video.media[0]?.mediaUrl, "https://cdn.example.com/video-123.mp4");
  assert.equal(
    video.media[0]?.thumbnailUrl,
    "https://cdn.example.com/video-123-thumbnail.jpg",
  );
  assert.equal(
    video.media[0]?.sizes?.medium?.mediaUrl,
    "https://behold.pictures/video-123/medium.webp",
  );
});

test("Behold carousel children and their ordering are retained", async () => {
  const fixture = JSON.parse(await readFile(FIXTURE_URL, "utf8")) as unknown;
  const posts = parseBeholdFeed(fixture);
  const carousel = posts.find((post) => post.sourceId === "carousel-456");

  assert.ok(carousel);
  assert.equal(carousel.metadata.mediaType, "CAROUSEL_ALBUM");
  assert.deepEqual(
    carousel.media[0]?.children?.map((child) => child.id),
    ["carousel-child-image", "carousel-child-video"],
  );
  assert.equal(carousel.media[0]?.children?.[0]?.mediaType, "IMAGE");
  assert.equal(carousel.media[0]?.children?.[1]?.mediaType, "VIDEO");
  assert.equal(
    carousel.media[0]?.children?.[1]?.thumbnailUrl,
    "https://cdn.example.com/carousel-child-video.jpg",
  );
});

test("Behold feed URL validation accepts only plausible HTTPS feed URLs", () => {
  assert.equal(
    validateBeholdFeedUrl("https://feeds.behold.so/abc_123-Z"),
    "https://feeds.behold.so/abc_123-Z",
  );
  assert.throws(() => validateBeholdFeedUrl(""), /Missing BEHOLD_FEED_URL/);
  assert.throws(
    () => validateBeholdFeedUrl("http://feeds.behold.so/feed-id"),
    /Invalid BEHOLD_FEED_URL/,
  );
  assert.throws(
    () => validateBeholdFeedUrl("https://example.com/feed-id"),
    /Invalid BEHOLD_FEED_URL/,
  );
});

test("malformed or incompatible Behold data fails safely", async () => {
  assert.throws(() => parseBeholdFeed({}), /missing the posts array/);

  const fixture = JSON.parse(await readFile(FIXTURE_URL, "utf8")) as {
    posts: Array<Record<string, unknown>>;
  };
  delete fixture.posts[0]?.sizes;
  assert.throws(() => parseBeholdFeed(fixture), /sizes must be an object/);
});

test("Behold request failures do not disclose the configured feed URL", async () => {
  const feedUrl = "https://feeds.behold.so/private-feed-id";
  await assert.rejects(
    fetchBeholdPosts(
      feedUrl,
      async () => new Response("not found", { status: 404 }),
    ),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /HTTP 404/);
      assert.doesNotMatch(error.message, /private-feed-id/);
      return true;
    },
  );
});
