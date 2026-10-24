import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { fetchSubstackPosts } from "../providers/substack.js";
import {
  fetchSubstackFeedXml,
  SubstackUnavailableError,
  type FetchSubstackFeedOptions,
} from "../substack-fetch.js";
import {
  SUBSTACK_FEED_URL,
  SUBSTACK_HEADER_PROFILES,
} from "../substack-profiles.js";

const FIXTURE_URL = new URL("../fixtures/substack.xml", import.meta.url);
const PROXY_URL = "https://proxy.test/substack-rss";
const TOKEN = "test-token";
const RETRY_DELAYS_MS = [1_000, 5_000, 10_000, 30_000, 60_000];

interface RecordedCall {
  headers: Record<string, string>;
  method: string;
  url: string;
}

function headerRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) {
    return {};
  }
  const pairs = headers instanceof Headers
    ? [...headers.entries()]
    : Array.isArray(headers)
      ? headers
      : Object.entries(headers);
  return Object.fromEntries(
    pairs.map(([key, value]) => [key.toLowerCase(), value]),
  );
}

function installFetch(responses: Array<Response | "network">) {
  const calls: RecordedCall[] = [];
  const delays: number[] = [];
  const logs: string[] = [];
  const queue = [...responses];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({
      headers: headerRecord(init?.headers),
      method: init?.method ?? "GET",
      url: String(input),
    });
    const next = queue.shift();
    if (next === undefined) {
      throw new Error(`Unexpected fetch ${String(input)}`);
    }
    if (next === "network") {
      throw new TypeError("network down");
    }
    return next;
  };
  const options: FetchSubstackFeedOptions = {
    fetchImpl,
    log: (message) => {
      logs.push(message);
    },
    now: () => 0,
    proxyToken: TOKEN,
    proxyUrl: PROXY_URL,
    sleep: async (ms) => {
      delays.push(ms);
    },
  };
  return { calls, delays, logs, options };
}

function blocked(): Response {
  return new Response("blocked", { status: 403 });
}

function rss(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "application/rss+xml" },
  });
}

function upstreamFailure(status: number, retryAfter?: string): Response {
  return new Response(
    JSON.stringify({ error: "upstream_failed", upstreamStatus: status }),
    {
      status: 502,
      headers: {
        "content-type": "application/json",
        ...(retryAfter ? { "retry-after": retryAfter } : {}),
      },
    },
  );
}

function directCalls(calls: RecordedCall[]): RecordedCall[] {
  return calls.filter((call) => call.url === SUBSTACK_FEED_URL);
}

function proxyCalls(calls: RecordedCall[]): RecordedCall[] {
  return calls.filter((call) => call.url.startsWith(PROXY_URL));
}

test("header profiles are internally consistent browser navigations", () => {
  assert.equal(SUBSTACK_HEADER_PROFILES.length, 6);
  const forbidden = [
    "accept-encoding",
    "authorization",
    "connection",
    "cookie",
    "host",
    "origin",
    "referer",
  ];
  for (const profile of SUBSTACK_HEADER_PROFILES) {
    assert.equal(profile.id, SUBSTACK_HEADER_PROFILES.indexOf(profile));
    for (const key of Object.keys(profile.headers)) {
      assert.equal(forbidden.includes(key), false, key);
    }
    assert.match(profile.headers.accept ?? "", /text\/html/);
    assert.equal(profile.headers["sec-fetch-dest"], "document");
    assert.equal(profile.headers["sec-fetch-mode"], "navigate");
    assert.equal(profile.headers["sec-fetch-site"], "none");
  }

  assert.match(SUBSTACK_HEADER_PROFILES[0]!.headers["sec-ch-ua"] ?? "", /Google Chrome/);
  assert.match(SUBSTACK_HEADER_PROFILES[0]!.headers["sec-ch-ua-platform"] ?? "", /macOS/);
  assert.match(SUBSTACK_HEADER_PROFILES[1]!.headers["user-agent"] ?? "", /Windows NT/);
  assert.match(SUBSTACK_HEADER_PROFILES[2]!.headers["sec-ch-ua"] ?? "", /Microsoft Edge/);
  assert.doesNotMatch(
    SUBSTACK_HEADER_PROFILES[2]!.headers["sec-ch-ua"] ?? "",
    /Google Chrome/,
  );
  assert.equal(SUBSTACK_HEADER_PROFILES[2]!.headers["sec-ch-ua-platform"], '"Windows"');
  assert.equal(SUBSTACK_HEADER_PROFILES[3]!.headers["sec-ch-ua"], undefined);
  assert.equal(SUBSTACK_HEADER_PROFILES[4]!.headers["sec-ch-ua"], undefined);
  assert.match(SUBSTACK_HEADER_PROFILES[3]!.headers["user-agent"] ?? "", /Firefox\/158/);
  assert.equal(SUBSTACK_HEADER_PROFILES[5]!.headers["sec-ch-ua"], undefined);
  assert.match(SUBSTACK_HEADER_PROFILES[5]!.headers["user-agent"] ?? "", /Version\/27/);
});

test("direct RSS fetch succeeds immediately and parses the feed", async () => {
  const xml = await readFile(FIXTURE_URL, "utf8");
  const harness = installFetch([rss(xml)]);

  const posts = await fetchSubstackPosts(harness.options);

  assert.equal(posts.length, 1);
  assert.equal(posts[0]?.title, "Women & Health — Today");
  assert.equal(harness.calls.length, 1);
  assert.equal(harness.delays.length, 0);
  assert.equal(proxyCalls(harness.calls).length, 0);
  assert.equal(
    harness.calls[0]?.headers["user-agent"],
    SUBSTACK_HEADER_PROFILES[0]?.headers["user-agent"],
  );
  assert.match(harness.logs[0] ?? "", /Substack direct attempt 1\/6 profile=0 \(chrome-macos\) status=200 elapsedMs=0/);
});

test("direct fetch retries a 403 and uses the next header profile", async () => {
  const xml = "<?xml version=\"1.0\"?><rss version=\"2.0\"><channel></channel></rss>";
  const harness = installFetch([blocked(), rss(xml)]);

  const body = await fetchSubstackFeedXml(harness.options);

  assert.equal(body, xml);
  assert.deepEqual(harness.delays, [1_000]);
  assert.equal(proxyCalls(harness.calls).length, 0);
  assert.equal(
    directCalls(harness.calls)[0]?.headers["user-agent"],
    SUBSTACK_HEADER_PROFILES[0]?.headers["user-agent"],
  );
  assert.equal(
    directCalls(harness.calls)[1]?.headers["user-agent"],
    SUBSTACK_HEADER_PROFILES[1]?.headers["user-agent"],
  );
  assert.match(harness.logs[0] ?? "", /attempt 1\/6 profile=0 \(chrome-macos\) status=403/);
  assert.match(harness.logs[1] ?? "", /attempt 2\/6 profile=1 \(chrome-windows\) status=200/);
});

test("direct fetch exhausts retries on the fixed schedule and then calls Netlify", async () => {
  const xml = "<rss version=\"2.0\"><channel></channel></rss>";
  const harness = installFetch([
    blocked(),
    blocked(),
    blocked(),
    blocked(),
    blocked(),
    blocked(),
    rss(xml),
  ]);

  const body = await fetchSubstackFeedXml(harness.options);

  assert.equal(body, xml);
  assert.equal(directCalls(harness.calls).length, 6);
  assert.equal(proxyCalls(harness.calls).length, 1);
  assert.deepEqual(harness.delays, RETRY_DELAYS_MS);
  directCalls(harness.calls).forEach((call, index) => {
    assert.equal(
      call.headers["user-agent"],
      SUBSTACK_HEADER_PROFILES[index]?.headers["user-agent"],
    );
  });
  const proxy = proxyCalls(harness.calls)[0]!;
  assert.equal(proxy.method, "POST");
  assert.equal(new URL(proxy.url).searchParams.get("profile"), "0");
  assert.equal(proxy.headers.authorization, `Bearer ${TOKEN}`);
  assert.equal(proxy.headers["user-agent"], undefined);
  assert.equal(proxy.headers["sec-ch-ua"], undefined);
  assert.equal(harness.logs.some((line) => line.includes(TOKEN)), false);
});

test("Netlify proxy succeeds on the first attempt and stops", async () => {
  const xml = "<rss version=\"2.0\"><channel></channel></rss>";
  const harness = installFetch([
    blocked(),
    blocked(),
    blocked(),
    blocked(),
    blocked(),
    blocked(),
    rss(xml),
  ]);

  const body = await fetchSubstackFeedXml(harness.options);

  assert.equal(body, xml);
  assert.equal(proxyCalls(harness.calls).length, 1);
  assert.equal(harness.calls.length, 7);
});

test("Netlify proxy retries an upstream 403 and then returns RSS", async () => {
  const xml = "<rss version=\"2.0\"><channel></channel></rss>";
  const harness = installFetch([
    blocked(),
    blocked(),
    blocked(),
    blocked(),
    blocked(),
    blocked(),
    upstreamFailure(403),
    rss(xml),
  ]);

  const body = await fetchSubstackFeedXml(harness.options);

  assert.equal(body, xml);
  assert.deepEqual(harness.delays, [...RETRY_DELAYS_MS, 1_000]);
  const proxies = proxyCalls(harness.calls);
  assert.equal(proxies.length, 2);
  assert.equal(new URL(proxies[0]!.url).searchParams.get("profile"), "0");
  assert.equal(new URL(proxies[1]!.url).searchParams.get("profile"), "1");
  assert.match(
    harness.logs.at(-2) ?? "",
    /Substack proxy attempt 1\/6 profile=0 \(chrome-macos\) status=403 elapsedMs=\d+ error=upstream_failed/,
  );
  assert.match(
    harness.logs.at(-1) ?? "",
    /Substack proxy attempt 2\/6 profile=1 \(chrome-windows\) status=200 elapsedMs=\d+/,
  );
});

test("direct and proxy retries both exhaust on the fixed schedule", async () => {
  const harness = installFetch([
    ...Array.from({ length: 6 }, () => blocked()),
    ...Array.from({ length: 6 }, () => upstreamFailure(403)),
  ]);

  await assert.rejects(
    fetchSubstackFeedXml(harness.options),
    (error: unknown) => {
      assert.ok(error instanceof SubstackUnavailableError);
      assert.equal(error.reason, "proxy_exhausted");
      assert.equal(error.lastStatus, 403);
      return true;
    },
  );
  assert.equal(directCalls(harness.calls).length, 6);
  assert.equal(proxyCalls(harness.calls).length, 6);
  assert.deepEqual(harness.delays, [...RETRY_DELAYS_MS, ...RETRY_DELAYS_MS]);
  proxyCalls(harness.calls).forEach((call, index) => {
    assert.equal(new URL(call.url).searchParams.get("profile"), String(index));
    assert.equal(
      call.headers.authorization,
      `Bearer ${TOKEN}`,
    );
    assert.equal(call.headers["user-agent"], undefined);
  });
});

test("proxy authentication failure is not retried as a Substack 403", async () => {
  const harness = installFetch([
    ...Array.from({ length: 6 }, () => blocked()),
    new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    }),
  ]);

  await assert.rejects(
    fetchSubstackFeedXml(harness.options),
    (error: unknown) => {
      assert.ok(error instanceof SubstackUnavailableError);
      assert.equal(error.reason, "proxy_unauthorized");
      assert.notEqual(error.lastStatus, 403);
      assert.match(error.message, /authentication failed/);
      return true;
    },
  );
  assert.equal(proxyCalls(harness.calls).length, 1);
  assert.deepEqual(harness.delays, RETRY_DELAYS_MS);
  assert.equal(harness.logs.some((line) => line.includes(TOKEN)), false);
});

test("a direct 429 waits for Retry-After up to 60 seconds", async () => {
  const xml = "<rss version=\"2.0\"><channel></channel></rss>";
  const harness = installFetch([
    new Response("slow", {
      status: 429,
      headers: { "retry-after": "120" },
    }),
    rss(xml),
  ]);

  await fetchSubstackFeedXml(harness.options);

  assert.deepEqual(harness.delays, [60_000]);
  assert.equal(proxyCalls(harness.calls).length, 0);
});

test("a direct 404 does not retry and does not call the proxy", async () => {
  const harness = installFetch([new Response("missing", { status: 404 })]);

  await assert.rejects(
    fetchSubstackFeedXml(harness.options),
    (error: unknown) => {
      assert.ok(error instanceof SubstackUnavailableError);
      assert.equal(error.reason, "direct_rejected");
      assert.equal(error.lastStatus, 404);
      return true;
    },
  );
  assert.equal(harness.calls.length, 1);
  assert.deepEqual(harness.delays, []);
});

test("missing proxy token skips the Netlify fallback after direct 403s", async () => {
  const harness = installFetch(Array.from({ length: 6 }, () => blocked()));
  harness.options.proxyToken = "   ";

  await assert.rejects(
    fetchSubstackFeedXml(harness.options),
    (error: unknown) => {
      assert.ok(error instanceof SubstackUnavailableError);
      assert.equal(error.reason, "proxy_token_missing");
      assert.match(error.message, /SUBSTACK_PROXY_TOKEN/);
      return true;
    },
  );
  assert.equal(directCalls(harness.calls).length, 6);
  assert.equal(proxyCalls(harness.calls).length, 0);
  assert.deepEqual(harness.delays, RETRY_DELAYS_MS);
});

test("an HTML challenge is retried instead of parsed as the feed", async () => {
  const xml = await readFile(FIXTURE_URL, "utf8");
  const harness = installFetch([
    new Response("<html><body>Enable JavaScript</body></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    }),
    rss(xml),
  ]);

  const posts = await fetchSubstackPosts(harness.options);

  assert.equal(posts[0]?.sourceId, "post-guid-123");
  assert.equal(directCalls(harness.calls).length, 2);
  assert.deepEqual(harness.delays, [1_000]);
  assert.equal(
    harness.logs.some((line) => /missing rss root|not valid XML/.test(line)),
    false,
  );
});
