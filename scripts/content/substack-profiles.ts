export const SUBSTACK_FEED_HOST = "everywomanhealth.substack.com";

export const SUBSTACK_FEED_URL = `https://${SUBSTACK_FEED_HOST}/feed`;

export const SUBSTACK_PROXY_URL =
  "https://everywoman.io/.netlify/functions/substack-rss";

export const SUBSTACK_RETRY_DELAYS_MS = [
  1_000, 5_000, 10_000, 30_000, 60_000,
] as const;

export const SUBSTACK_RETRY_AFTER_CAP_MS = 60_000;

const CHROME_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7";
const DOCUMENT_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

const NAVIGATION_HEADERS = {
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
} as const;

export interface SubstackHeaderProfile {
  headers: Record<string, string>;
  id: number;
  name: string;
}

// Stable desktop releases as of 23 October 2026.
// Accept-Encoding is intentionally omitted so Node fetch can advertise the
// encodings it decodes and decompress the body before response.text().
export const SUBSTACK_HEADER_PROFILES: readonly SubstackHeaderProfile[] = [
  {
    id: 0,
    name: "chrome-macos",
    headers: {
      accept: CHROME_ACCEPT,
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua":
        '"Google Chrome";v="156", "Chromium";v="156", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      ...NAVIGATION_HEADERS,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36",
    },
  },
  {
    id: 1,
    name: "chrome-windows",
    headers: {
      accept: CHROME_ACCEPT,
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua":
        '"Google Chrome";v="156", "Chromium";v="156", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      ...NAVIGATION_HEADERS,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36",
    },
  },
  {
    id: 2,
    name: "edge-windows",
    headers: {
      accept: CHROME_ACCEPT,
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua":
        '"Microsoft Edge";v="156", "Chromium";v="156", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      ...NAVIGATION_HEADERS,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0",
    },
  },
  {
    id: 3,
    name: "firefox-macos",
    headers: {
      accept: DOCUMENT_ACCEPT,
      "accept-language": "en-US,en;q=0.5",
      ...NAVIGATION_HEADERS,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:158.0) Gecko/20100101 Firefox/158.0",
    },
  },
  {
    id: 4,
    name: "firefox-windows",
    headers: {
      accept: DOCUMENT_ACCEPT,
      "accept-language": "en-US,en;q=0.5",
      ...NAVIGATION_HEADERS,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0",
    },
  },
  {
    id: 5,
    name: "safari-macos",
    headers: {
      accept: DOCUMENT_ACCEPT,
      "accept-language": "en-US,en;q=0.9",
      ...NAVIGATION_HEADERS,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15",
    },
  },
];

export function getSubstackHeaderProfile(
  index: number,
): SubstackHeaderProfile | undefined {
  return SUBSTACK_HEADER_PROFILES[index];
}

export function isRssDocument(body: string): boolean {
  return /<rss[\s>]/i.test(body);
}

export function isHtmlDocument(
  body: string,
  contentType: string | null,
): boolean {
  if (contentType?.toLowerCase().includes("text/html")) {
    return true;
  }
  const start = body.trimStart().slice(0, 256).toLowerCase();
  return start.startsWith("<!doctype html") || start.startsWith("<html");
}
