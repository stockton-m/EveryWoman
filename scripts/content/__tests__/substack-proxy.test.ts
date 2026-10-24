import assert from "node:assert/strict";
import { test } from "node:test";

import {
  handleSubstackRssRequest,
  type SubstackProxyDependencies,
} from "../substack-proxy.js";
import {
  SUBSTACK_FEED_URL,
  SUBSTACK_HEADER_PROFILES,
} from "../substack-profiles.js";

const TOKEN = "proxy-token";
const ENDPOINT = "https://everywoman.io/.netlify/functions/substack-rss";
const RSS = "<rss version=\"2.0\"><channel></channel></rss>";

interface RecordedCall {
  headers: Record<string, string>;
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

function installFetch(response: Response | "network" | (() => Response)) {
  const calls: RecordedCall[] = [];
  const logs: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({
      headers: headerRecord(init?.headers),
      url: String(input),
    });
    if (response === "network") {
      throw new TypeError("network down");
    }
    return typeof response === "function" ? response() : response;
  };
  const dependencies: SubstackProxyDependencies = {
    fetchImpl,
    log: (message) => {
      logs.push(message);
    },
    now: () => 5,
    token: TOKEN,
  };
  return { calls, dependencies, logs };
}

function authorized(profile: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  if (!headers.has("authorization")) {
    headers.set("authorization", `Bearer ${TOKEN}`);
  }
  return new Request(`${ENDPOINT}?profile=${profile}`, {
    ...init,
    headers,
    method: init.method ?? "POST",
  });
}

test("a successful proxy invocation fetches Substack once and returns RSS", async () => {
  const harness = installFetch(new Response(RSS, {
    status: 200,
    headers: {
      "content-encoding": "gzip",
      "content-type": "application/rss+xml",
      "set-cookie": "session=secret",
    },
  }));

  const response = await handleSubstackRssRequest(
    authorized("0"),
    harness.dependencies,
  );

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("content-type"),
    "application/rss+xml; charset=utf-8",
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("content-encoding"), null);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(await response.text(), RSS);
  assert.equal(harness.calls.length, 1);
  assert.equal(harness.calls[0]?.url, SUBSTACK_FEED_URL);
  assert.equal(
    harness.calls[0]?.headers["user-agent"],
    SUBSTACK_HEADER_PROFILES[0]?.headers["user-agent"],
  );
  assert.match(harness.logs[0] ?? "", /profile=0 upstreamStatus=200 elapsedMs=0/);
  assert.equal(harness.logs.some((line) => line.includes(TOKEN)), false);
});

test("an upstream 403 performs one fetch and reports that status", async () => {
  const harness = installFetch(new Response("blocked-body", { status: 403 }));

  const response = await handleSubstackRssRequest(
    authorized("1"),
    harness.dependencies,
  );
  const body = await response.json() as { error: string; upstreamStatus: number };

  assert.equal(response.status, 502);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(body, { error: "upstream_failed", upstreamStatus: 403 });
  assert.equal(JSON.stringify(body).includes("blocked-body"), false);
  assert.equal(harness.calls.length, 1);
  assert.equal(harness.calls[0]?.url, SUBSTACK_FEED_URL);
});

test("an upstream network error performs one fetch", async () => {
  const harness = installFetch("network");

  const response = await handleSubstackRssRequest(
    authorized("0"),
    harness.dependencies,
  );

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "upstream_unreachable" });
  assert.equal(harness.calls.length, 1);
  assert.match(harness.logs[0] ?? "", /upstreamStatus=network/);
});

test("missing configuration, bad credentials, bad methods, and bad profiles do not fetch", async () => {
  const cases: Array<{
    dependencies: SubstackProxyDependencies;
    request: Request;
    status: number;
    error: string;
  }> = [
    {
      request: authorized("0"),
      dependencies: { token: "  ", fetchImpl: async () => { throw new Error("fetched"); } },
      status: 503,
      error: "not_configured",
    },
    {
      request: new Request(`${ENDPOINT}?profile=0`, {
        method: "POST",
        headers: { authorization: "Bearer wrong-token" },
      }),
      dependencies: { token: TOKEN, fetchImpl: async () => { throw new Error("fetched"); } },
      status: 401,
      error: "unauthorized",
    },
    {
      request: new Request(`${ENDPOINT}?profile=0`, { method: "GET" }),
      dependencies: { token: TOKEN, fetchImpl: async () => { throw new Error("fetched"); } },
      status: 405,
      error: "method_not_allowed",
    },
    {
      request: authorized("99"),
      dependencies: { token: TOKEN, fetchImpl: async () => { throw new Error("fetched"); } },
      status: 400,
      error: "invalid_profile",
    },
  ];

  for (const item of cases) {
    const logs: string[] = [];
    const response = await handleSubstackRssRequest(item.request, {
      ...item.dependencies,
      log: (message) => {
        logs.push(message);
      },
    });
    assert.equal(response.status, item.status);
    assert.deepEqual(await response.json(), { error: item.error });
    assert.equal(logs.some((line) => line.includes(TOKEN) || line.includes("wrong-token")), false);
  }
});

test("profile 2 uses the Edge profile and ignores caller-supplied URLs", async () => {
  const harness = installFetch(new Response(RSS, { status: 200 }));
  const request = new Request(
    `${ENDPOINT}?profile=2&url=https://evil.example/feed`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${TOKEN}`,
        "x-upstream-url": "https://evil.example/feed",
      },
      body: JSON.stringify({ url: "https://evil.example/feed" }),
    },
  );

  const response = await handleSubstackRssRequest(request, harness.dependencies);

  assert.equal(response.status, 200);
  assert.equal(harness.calls.length, 1);
  assert.equal(harness.calls[0]?.url, SUBSTACK_FEED_URL);
  assert.deepEqual(
    harness.calls[0]?.headers,
    SUBSTACK_HEADER_PROFILES[2]?.headers,
  );
  assert.match(harness.calls[0]?.headers["sec-ch-ua"] ?? "", /Microsoft Edge/);
  assert.doesNotMatch(harness.calls[0]?.headers["user-agent"] ?? "", /evil\.example/);
});
