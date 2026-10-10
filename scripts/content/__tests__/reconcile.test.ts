import assert from "node:assert/strict";
import { test } from "node:test";

import { serializeArchive } from "../archive.js";
import { reconcile } from "../reconcile.js";
import {
  emptyArchive,
  makeInstagramPost,
  makeSubstackPost,
  makeTikTokPost,
} from "./test-helpers.js";

test("an empty archive is populated from both providers", () => {
  const substack = makeSubstackPost();
  const instagram = makeInstagramPost();
  const result = reconcile(emptyArchive(), [substack, instagram]);

  assert.equal(result.archive.posts.length, 2);
  assert.equal(result.stats.totalAdded, 2);
  assert.equal(result.stats.bySource.substack.added, 1);
  assert.equal(result.stats.bySource.instagram.added, 1);
});

test("identical records remain unchanged", () => {
  const post = makeSubstackPost();
  const existing = { ...emptyArchive(), posts: [post] };
  const result = reconcile(existing, [structuredClone(post)]);

  assert.equal(result.stats.totalUpdated, 0);
  assert.equal(result.stats.bySource.substack.unchanged, 1);
  assert.strictEqual(result.archive.posts[0], post);
});

test("identical records with absent optional fields remain unchanged", () => {
  const post = makeSubstackPost();
  delete post.description;
  const existing = { ...emptyArchive(), posts: [post] };
  const result = reconcile(existing, [structuredClone(post)]);

  assert.equal(result.stats.bySource.substack.unchanged, 1);
  assert.strictEqual(result.archive.posts[0], post);
});

test("new records are inserted while records absent from feeds remain archived", () => {
  const retained = makeSubstackPost();
  const inserted = makeInstagramPost();
  const existing = { ...emptyArchive(), posts: [retained] };
  const result = reconcile(existing, [inserted]);

  assert.deepEqual(
    result.archive.posts.map((post) => post.id).sort(),
    [retained.id, inserted.id].sort(),
  );
  assert.equal(result.stats.totalAdded, 1);
});

test("duplicate incoming IDs do not create duplicate records", () => {
  const post = makeInstagramPost();
  const result = reconcile(emptyArchive(), [
    structuredClone(post),
    structuredClone(post),
  ]);

  assert.equal(result.archive.posts.length, 1);
  assert.equal(result.stats.bySource.instagram.added, 1);
  assert.equal(result.stats.bySource.instagram.duplicates, 1);
});

test("conflicting duplicate incoming IDs fail safely", () => {
  const post = makeInstagramPost();
  const conflict = makeInstagramPost({
    description: "Conflicting description",
  });

  assert.throws(
    () => reconcile(emptyArchive(), [post, conflict]),
    /conflicting records/,
  );
});

test("modified upstream content updates an existing record", () => {
  const original = makeSubstackPost();
  const edited = makeSubstackPost({
    title: "Edited upstream title",
    bodyHtml: "<p>Edited upstream body.</p>",
  });
  const result = reconcile(
    { ...emptyArchive(), posts: [original] },
    [edited],
  );

  assert.equal(result.stats.totalUpdated, 1);
  assert.equal(
    result.archive.posts[0]?.source === "substack"
      ? result.archive.posts[0].title
      : undefined,
    "Edited upstream title",
  );
  assert.equal(
    result.archive.posts[0]?.source === "substack"
      ? result.archive.posts[0].bodyHtml
      : undefined,
    "<p>Edited upstream body.</p>",
  );
});

test("missing optional upstream fields do not erase useful archived data", () => {
  const existing = makeInstagramPost({
    media: [
      {
        id: "instagram-id-1",
        mediaType: "IMAGE",
        mediaUrl: "https://cdn.example.com/image.jpg",
        altText: "Archived alt text",
        colorPalette: { dominant: "10,20,30" },
      },
    ],
  });
  const incoming = makeInstagramPost({
    metadata: {
      mediaType: "IMAGE",
    },
  });
  delete incoming.description;

  const result = reconcile(
    { ...emptyArchive(), posts: [existing] },
    [incoming],
  );

  assert.equal(result.stats.bySource.instagram.unchanged, 1);
  assert.deepEqual(result.archive.posts[0], existing);
});

test("records missing from all incoming feeds are never deleted", () => {
  const original = makeSubstackPost();
  const result = reconcile(
    { ...emptyArchive(), posts: [original] },
    [],
  );

  assert.deepEqual(result.archive.posts, [original]);
  assert.equal(result.stats.totalAdded, 0);
  assert.equal(result.stats.totalUpdated, 0);
});

test("an archived Substack slug survives upstream title and URL changes", () => {
  const original = makeSubstackPost({ slug: "stable-local-slug" });
  const edited = makeSubstackPost({
    sourceUrl: "https://everywomanhealth.substack.com/p/new-upstream-slug",
    slug: "new-upstream-slug",
    title: "A completely different title",
  });
  const result = reconcile(
    { ...emptyArchive(), posts: [original] },
    [edited],
  );
  const post = result.archive.posts[0];

  assert.equal(post?.source, "substack");
  assert.equal(post?.source === "substack" ? post.slug : undefined, "stable-local-slug");
  assert.equal(post?.sourceUrl, edited.sourceUrl);
});

test("new slug collisions receive deterministic source-derived suffixes", () => {
  const first = makeSubstackPost({
    sourceId: "guid-a",
    id: "substack:guid-a",
    slug: "same-slug",
  });
  const second = makeSubstackPost({
    sourceId: "guid-b",
    id: "substack:guid-b",
    slug: "same-slug",
  });
  const result = reconcile(emptyArchive(), [second, first]);
  const slugs = result.archive.posts
    .filter((post) => post.source === "substack")
    .map((post) => post.slug);

  assert.equal(new Set(slugs).size, 2);
  assert.ok(slugs.includes("same-slug"));
  assert.ok(slugs.some((slug) => /^same-slug-[a-f0-9]{8}$/.test(slug)));
});

test("TikTok posts are added, updated, and left unchanged", () => {
  const original = makeTikTokPost();
  const added = reconcile(emptyArchive(), [original]);
  assert.equal(added.stats.bySource.tiktok.added, 1);
  assert.equal(added.stats.totalAdded, 1);

  const repeated = reconcile(added.archive, [structuredClone(original)]);
  assert.equal(repeated.stats.bySource.tiktok.unchanged, 1);
  assert.equal(repeated.stats.totalUpdated, 0);
  assert.deepEqual(repeated.archive.posts[0], original);

  const edited = makeTikTokPost({
    description: "Updated caption",
    metadata: {
      ...original.metadata,
      caption: "Updated caption #womenshealth",
      prunedCaption: "Updated caption",
    },
  });
  const updated = reconcile(repeated.archive, [edited]);
  assert.equal(updated.stats.bySource.tiktok.updated, 1);
  assert.equal(
    updated.archive.posts[0]?.source === "tiktok"
      ? updated.archive.posts[0].description
      : undefined,
    "Updated caption",
  );
});

test("an archived TikTok thumbnail path survives a later sync", () => {
  const original = makeTikTokPost({
    metadata: {
      author: "everywomanhealth",
      caption: "Original caption",
      prunedCaption: "Original caption",
      thumbnailPath: "tiktok/7685236720534637837.jpg",
    },
  });
  const incoming = makeTikTokPost({
    description: "Updated caption",
    metadata: {
      author: "everywomanhealth",
      caption: "Updated caption",
      prunedCaption: "Updated caption",
    },
  });
  const result = reconcile(
    { ...emptyArchive(), posts: [original] },
    [incoming],
  );
  const post = result.archive.posts[0];

  assert.equal(result.stats.bySource.tiktok.updated, 1);
  assert.equal(post?.description, "Updated caption");
  assert.equal(
    post?.source === "tiktok" ? post.metadata.thumbnailPath : undefined,
    "tiktok/7685236720534637837.jpg",
  );
});

test("duplicate TikTok records are ignored when they match", () => {
  const post = makeTikTokPost();
  const result = reconcile(emptyArchive(), [post, structuredClone(post)]);

  assert.equal(result.archive.posts.length, 1);
  assert.equal(result.stats.bySource.tiktok.added, 1);
  assert.equal(result.stats.bySource.tiktok.duplicates, 1);
});

test("TikTok posts absent from the latest dataset remain archived", () => {
  const retained = makeTikTokPost();
  const incoming = makeSubstackPost();
  const result = reconcile(
    { ...emptyArchive(), posts: [retained] },
    [incoming],
  );

  assert.equal(result.archive.posts.length, 2);
  assert.ok(result.archive.posts.some((post) => post.id === retained.id));
  assert.equal(result.stats.bySource.tiktok.fetched, 0);
  assert.deepEqual(
    result.archive.posts.find((post) => post.id === retained.id),
    retained,
  );
});

test("an empty TikTok payload does not erase an archived cover or description", () => {
  const existing = makeTikTokPost({
    media: [
      {
        id: "7685236720534637837",
        mediaType: "VIDEO",
        mediaUrl: "https://cdn.example.com/cover.jpg",
        thumbnailUrl: "https://cdn.example.com/cover.jpg",
      },
    ],
  });
  const incoming = makeTikTokPost();
  delete incoming.description;

  const result = reconcile(
    { ...emptyArchive(), posts: [existing] },
    [incoming],
  );

  assert.equal(result.stats.bySource.tiktok.unchanged, 1);
  assert.deepEqual(result.archive.posts[0], existing);
});

test("equivalent input produces identical serialized output", () => {
  const older = makeSubstackPost();
  const newer = makeInstagramPost();
  const first = reconcile(emptyArchive(), [older, newer]).archive;
  const second = reconcile(emptyArchive(), [newer, older]).archive;

  assert.equal(serializeArchive(first), serializeArchive(second));
  assert.ok(serializeArchive(first).endsWith("\n"));
});
