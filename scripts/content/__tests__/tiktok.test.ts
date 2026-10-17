import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { parseArchiveJson, serializeArchive } from "../archive.js";
import { getSyncConfiguration } from "../config.js";
import {
  fetchTikTokPosts,
  parseTikTokDataset,
  validateApifyTaskId,
  validateApifyToken,
} from "../providers/tiktok.js";
import { reconcile } from "../reconcile.js";
import { emptyArchive } from "./test-helpers.js";

const FIXTURE_URL = new URL("../fixtures/tiktok.json", import.meta.url);
const TOKEN = "super-secret-apify-token";
const NOW = new Date("2026-10-10T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

interface RecordedRequest {
  authorization: string | null;
  method: string;
  url: string;
}

async function loadFixture(): Promise<Array<Record<string, unknown>>> {
  return JSON.parse(await readFile(FIXTURE_URL, "utf8")) as Array<
    Record<string, unknown>
  >;
}

function runPayload(finishedAt: string): unknown {
  return {
    data: {
      defaultDatasetId: "dataset123",
      finishedAt,
      id: "run123",
      status: "SUCCEEDED",
    },
  };
}

function createFetch(options: {
  dataset?: unknown;
  datasetStatus?: number;
  run?: unknown;
  runBody?: string;
  runStatus?: number;
}): { fetchImpl: typeof fetch; requests: RecordedRequest[] } {
  const requests: RecordedRequest[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const headers = new Headers(init?.headers);
    requests.push({
      authorization: headers.get("authorization"),
      method: init?.method ?? "GET",
      url,
    });

    if (url.includes("/runs/last")) {
      return new Response(options.runBody ?? JSON.stringify(options.run), {
        status: options.runStatus ?? 200,
      });
    }

    return new Response(JSON.stringify(options.dataset ?? []), {
      status: options.datasetStatus ?? 200,
    });
  };

  return { fetchImpl, requests };
}

test("TikTok normalization keeps stable post fields and drops volatile scraper data", async () => {
  const fixture = await loadFixture();
  const posts = parseTikTokDataset(fixture);
  const first = posts[0];

  assert.equal(posts.length, 3);
  assert.ok(first);
  assert.equal(first.id, "tiktok:7685236720534637837");
  assert.equal(first.sourceId, "7685236720534637837");
  assert.equal(
    first.sourceUrl,
    "https://www.tiktok.com/@everywomanhealth/video/7685236720534637837",
  );
  assert.equal(first.publishedAt, "2026-09-14T04:04:00.000Z");
  assert.equal(
    first.description,
    "Feeling initimadated by the weight room, ladies? Don’t be… they’re too busy looking at themselves in the mirror 🤷‍♀️",
  );
  assert.equal(first.metadata.author, "everywomanhealth");
  assert.equal(first.metadata.durationSeconds, 66);
  assert.deepEqual(first.metadata.hashtags, [
    "womenshealth",
    "womensfitness",
    "fitnesstipsforwomen",
    "gymtok",
  ]);
  assert.deepEqual(first.media, []);

  const slideshow = posts.find(
    (post) => post.sourceId === "7644211611959348493",
  );
  assert.equal(slideshow?.metadata.durationSeconds, 0);

  const withQuery = posts.find(
    (post) => post.sourceId === "7639884023241657613",
  );
  assert.equal(
    withQuery?.sourceUrl,
    "https://www.tiktok.com/@everywomanhealth/video/7639884023241657613",
  );

  const serialized = JSON.stringify(posts);
  assert.doesNotMatch(serialized, /tiktokcdn|diggCount|playCount|musicMeta|avatar/i);

  const altered = structuredClone(fixture);
  const firstItem = altered[0];
  assert.ok(firstItem);
  firstItem.diggCount = 99999;
  firstItem.playCount = 1;
  firstItem["authorMeta.avatar"] =
    "https://p16-sign.tiktokcdn-us.com/other.jpeg?x-expires=1&x-signature=abc";
  assert.deepEqual(parseTikTokDataset(altered), posts);
});

test("nested Apify records normalize like the flat task output", async () => {
  const [flat] = await loadFixture();
  assert.ok(flat);
  const nested = {
    authorMeta: { name: flat["authorMeta.name"] },
    createTimeISO: flat.createTimeISO,
    diggCount: flat.diggCount,
    text: flat.text,
    videoMeta: { duration: flat["videoMeta.duration"] },
    webVideoUrl: flat.webVideoUrl,
  };

  assert.deepEqual(parseTikTokDataset([nested]), parseTikTokDataset([flat]));
});

test("stable cover URLs are kept and signed TikTok CDN URLs are not archived", async () => {
  const [flat] = await loadFixture();
  assert.ok(flat);
  const signed = structuredClone(flat);
  signed["videoMeta.coverUrl"] =
    "https://p16-sign.tiktokcdn-us.com/cover.jpeg?x-expires=1791817200&x-signature=abc";
  assert.deepEqual(parseTikTokDataset([signed])[0]?.media, []);

  const stable = structuredClone(flat);
  stable["videoMeta.coverUrl"] = signed["videoMeta.coverUrl"];
  stable["videoMeta.originalCoverUrl"] = "https://cdn.example.com/cover.jpg";
  assert.deepEqual(parseTikTokDataset([stable])[0]?.media, [
    {
      id: "7685236720534637837",
      mediaType: "VIDEO",
      mediaUrl: "https://cdn.example.com/cover.jpg",
      thumbnailUrl: "https://cdn.example.com/cover.jpg",
    },
  ]);
});

test("malformed TikTok data fails instead of being archived", async () => {
  const fixture = await loadFixture();
  assert.throws(() => parseTikTokDataset({}), /response must be an array/);
  assert.throws(
    () => parseTikTokDataset([]),
    /contained no TikTok posts/,
  );

  const missingUrl = structuredClone(fixture);
  delete missingUrl[0]?.webVideoUrl;
  assert.throws(() => parseTikTokDataset(missingUrl), /webVideoUrl/);

  const wrongAuthor = structuredClone(fixture);
  if (wrongAuthor[0]) {
    wrongAuthor[0]["authorMeta.name"] = "someoneelse";
  }
  assert.throws(
    () => parseTikTokDataset(wrongAuthor),
    /not an @everywomanhealth post/,
  );

  const badDuration = structuredClone(fixture);
  if (badDuration[0]) {
    badDuration[0]["videoMeta.duration"] = "66";
  }
  assert.throws(() => parseTikTokDataset(badDuration), /videoMeta.duration/);
});

test("Apify task identifiers use the username~task-name form", () => {
  assert.equal(
    validateApifyTaskId("everywoman/everywoman-tiktok"),
    "everywoman~everywoman-tiktok",
  );
  assert.equal(
    validateApifyTaskId("everywoman~everywoman-tiktok"),
    "everywoman~everywoman-tiktok",
  );
  assert.throws(() => validateApifyTaskId(""), /Missing APIFY_TASK_ID/);
  assert.throws(() => validateApifyTaskId("not a task"), /Invalid APIFY_TASK_ID/);
  assert.throws(() => validateApifyToken(""), /Missing APIFY_TOKEN/);
  assert.throws(() => validateApifyToken("secret token"), /Invalid APIFY_TOKEN/);
});

test("sync configuration requires Apify credentials", () => {
  assert.throws(
    () =>
      getSyncConfiguration({
        BEHOLD_FEED_URL: "https://feeds.behold.so/abc",
      }),
    /Missing APIFY_TOKEN/,
  );

  const configuration = getSyncConfiguration({
    APIFY_TASK_ID: "everywoman/everywoman-tiktok",
    APIFY_TOKEN: TOKEN,
    BEHOLD_FEED_URL: "https://feeds.behold.so/abc",
  });
  assert.equal(configuration.apifyTaskId, "everywoman~everywoman-tiktok");
  assert.equal(configuration.apifyToken, TOKEN);
});

test("fetch reads only the latest successful task run and its dataset", async () => {
  const fixture = await loadFixture();
  const { fetchImpl, requests } = createFetch({
    dataset: fixture,
    run: runPayload("2026-10-09T12:00:00.000Z"),
  });
  const warnings: string[] = [];
  const posts = await fetchTikTokPosts({
    fetchImpl,
    now: () => NOW,
    taskId: "everywoman/everywoman-tiktok",
    token: TOKEN,
    warn: (message) => warnings.push(message),
  });

  assert.equal(posts.length, 3);
  assert.deepEqual(warnings, []);
  assert.deepEqual(
    requests.map((request) => request.method),
    ["GET", "GET"],
  );
  assert.equal(
    requests[0]?.url,
    "https://api.apify.com/v2/actor-tasks/everywoman~everywoman-tiktok/runs/last?status=SUCCEEDED",
  );
  assert.equal(
    requests[1]?.url,
    "https://api.apify.com/v2/datasets/dataset123/items?format=json",
  );
  assert.ok(requests.every((request) => !request.url.includes(TOKEN)));
  assert.ok(
    requests.every(
      (request) => request.authorization === `Bearer ${TOKEN}`,
    ),
  );
  assert.ok(requests.every((request) => !/\/runs(?!\/last)/.test(request.url)));
});

test("a dataset older than three days warns and one older than seven days fails", async () => {
  const fixture = await loadFixture();
  const stale = createFetch({
    dataset: fixture,
    run: runPayload(new Date(NOW.getTime() - 4 * DAY_MS).toISOString()),
  });
  const warnings: string[] = [];
  const posts = await fetchTikTokPosts({
    fetchImpl: stale.fetchImpl,
    now: () => NOW,
    taskId: "everywoman~everywoman-tiktok",
    token: TOKEN,
    warn: (message) => warnings.push(message),
  });
  assert.equal(posts.length, 3);
  assert.match(warnings[0] ?? "", /more than 3 days old/);

  const expired = createFetch({
    dataset: fixture,
    run: runPayload(new Date(NOW.getTime() - 8 * DAY_MS).toISOString()),
  });
  await assert.rejects(
    fetchTikTokPosts({
      fetchImpl: expired.fetchImpl,
      now: () => NOW,
      taskId: "everywoman~everywoman-tiktok",
      token: TOKEN,
    }),
    /older than 7 days/,
  );
  assert.equal(expired.requests.length, 1);
});

test("missing, expired, and rejected Apify responses fail without exposing the token", async () => {
  const missingRun = createFetch({ runStatus: 404, runBody: "missing" });
  await assert.rejects(
    fetchTikTokPosts({
      fetchImpl: missingRun.fetchImpl,
      taskId: "everywoman~everywoman-tiktok",
      token: TOKEN,
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /No successful Apify task run/);
      assert.match(error.message, /not treated as empty/);
      assert.doesNotMatch(error.message, new RegExp(TOKEN));
      return true;
    },
  );
  assert.equal(missingRun.requests.length, 1);

  const missingDataset = createFetch({
    datasetStatus: 404,
    run: runPayload("2026-10-09T12:00:00.000Z"),
  });
  await assert.rejects(
    fetchTikTokPosts({
      fetchImpl: missingDataset.fetchImpl,
      now: () => NOW,
      taskId: "everywoman~everywoman-tiktok",
      token: TOKEN,
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /unavailable or expired/);
      assert.doesNotMatch(error.message, new RegExp(TOKEN));
      return true;
    },
  );

  const rejected = createFetch({ runStatus: 401, runBody: TOKEN });
  await assert.rejects(
    fetchTikTokPosts({
      fetchImpl: rejected.fetchImpl,
      taskId: "everywoman~everywoman-tiktok",
      token: TOKEN,
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /rejected the API token/);
      assert.doesNotMatch(error.message, new RegExp(TOKEN));
      return true;
    },
  );

  const malformed = createFetch({ runBody: "not-json" });
  await assert.rejects(
    fetchTikTokPosts({
      fetchImpl: malformed.fetchImpl,
      taskId: "everywoman~everywoman-tiktok",
      token: TOKEN,
    }),
    /malformed JSON/,
  );

  await assert.rejects(
    fetchTikTokPosts({
      fetchImpl: async () => {
        throw new Error(`network down ${TOKEN}`);
      },
      taskId: "everywoman~everywoman-tiktok",
      token: TOKEN,
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Unable to reach Apify/);
      assert.doesNotMatch(error.message, new RegExp(TOKEN));
      return true;
    },
  );
});

test("an empty dataset is an error and repeated normalization does not change the archive", async () => {
  const fixture = await loadFixture();
  const empty = createFetch({
    dataset: [],
    run: runPayload("2026-10-09T12:00:00.000Z"),
  });
  await assert.rejects(
    fetchTikTokPosts({
      fetchImpl: empty.fetchImpl,
      now: () => NOW,
      taskId: "everywoman~everywoman-tiktok",
      token: TOKEN,
    }),
    /contained no TikTok posts/,
  );

  const posts = parseTikTokDataset(fixture);
  const first = reconcile(emptyArchive(), posts);
  const serialized = serializeArchive(first.archive);
  const second = reconcile(parseArchiveJson(serialized), parseTikTokDataset(fixture));

  assert.equal(serializeArchive(second.archive), serialized);
  assert.equal(second.stats.bySource.tiktok.unchanged, posts.length);
  assert.equal(second.stats.totalUpdated, 0);
});
