import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  parseSubstackFeed,
  sanitizeSubstackHtml,
} from "../providers/substack.js";

const FIXTURE_URL = new URL("../fixtures/substack.xml", import.meta.url);

test("Substack RSS preserves meaningful article HTML and removes promotional UI", async () => {
  const xml = await readFile(FIXTURE_URL, "utf8");
  const posts = parseSubstackFeed(xml);

  assert.equal(posts.length, 1);
  const post = posts[0]!;
  assert.equal(post.sourceId, "post-guid-123");
  assert.equal(post.id, "substack:post-guid-123");
  assert.equal(post.slug, "women-and-health");
  assert.equal(post.title, "Women & Health — Today");
  assert.equal(
    post.description,
    "An evidence-based overview & practical guide.",
  );
  assert.equal(post.publishedAt, "2026-09-20T15:00:00.000Z");
  assert.equal(post.metadata.author, "Madeleine Stockton");
  assert.equal(
    post.media[0]?.mediaUrl,
    "https://substackcdn.com/images/cover.jpg",
  );

  assert.match(post.bodyHtml, /<h2>/);
  assert.match(post.bodyHtml, /<ul>/);
  assert.match(post.bodyHtml, /<blockquote>/);
  assert.match(post.bodyHtml, /<img[^>]+article\.jpg/);
  assert.match(post.bodyHtml, /https:\/\/example\.com\/research\?a=1&amp;b=2/);
  assert.match(post.bodyHtml, /noopener noreferrer/);
  assert.match(post.bodyHtml, /<h3>Sources<\/h3>/);
  assert.match(post.bodyHtml, /https:\/\/example\.org\/citation/);
  assert.doesNotMatch(post.bodyHtml, /button-wrapper/);
  assert.doesNotMatch(post.bodyHtml, /Subscribe now/);
  assert.doesNotMatch(post.bodyHtml, /Leave a comment/);
  assert.doesNotMatch(post.bodyHtml, /onerror/);
  assert.doesNotMatch(post.bodyHtml, /<script/);
  assert.doesNotMatch(post.bodyHtml, /&amp;amp;/);
});

test("Substack sanitizer handles HTML entities without double encoding", () => {
  const body = sanitizeSubstackHtml(
    "<p>Research &amp; care &#8212; <strong>together</strong>.</p>",
  );

  assert.match(body, /Research &amp; care/);
  assert.doesNotMatch(body, /&amp;amp;/);
  assert.match(body, /<strong>together<\/strong>/);
});

test("Substack records without full article bodies fail explicitly", () => {
  const xml = `<?xml version="1.0"?>
    <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
      <channel>
        <item>
          <title>Incomplete article</title>
          <link>https://everywomanhealth.substack.com/p/incomplete</link>
          <guid>incomplete-guid</guid>
          <pubDate>Sun, 20 Sep 2026 15:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>`;

  assert.throws(() => parseSubstackFeed(xml), /no content:encoded body/);
});

test("malformed Substack structures fail safely", () => {
  assert.throws(
    () => parseSubstackFeed("<not-rss><channel /></not-rss>"),
    /missing rss root/,
  );
});
