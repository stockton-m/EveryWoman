import { createHash } from "node:crypto";

import { XMLParser } from "fast-xml-parser";
import { decode } from "html-entities";
import sanitizeHtml from "sanitize-html";

import type { ArchiveMedia, SubstackPost } from "../types.js";

export const SUBSTACK_FEED_URL =
  "https://everywomanhealth.substack.com/feed";

const XML_PARSER = new XMLParser({
  ignoreAttributes: false,
  isArray: (name, path) => name === "item" && path === "rss.channel.item",
  parseTagValue: false,
  processEntities: true,
  trimValues: false,
});

const ALLOWED_HTML_TAGS = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "picture",
  "pre",
  "s",
  "source",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractText(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(extractText).filter(Boolean).join("");
  }
  if (!isRecord(value)) {
    return undefined;
  }

  const cdata = extractText(value.__cdata);
  const text = extractText(value["#text"]);
  return cdata ?? text;
}

function requireText(value: unknown, field: string): string {
  const text = extractText(value)?.trim();
  if (!text) {
    throw new Error(`Invalid Substack feed: ${field} is missing.`);
  }
  return text;
}

function optionalText(value: unknown): string | undefined {
  const text = extractText(value)?.trim();
  return text || undefined;
}

function normalizeHttpUrl(value: string, field: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid Substack feed: ${field} is not a valid URL.`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Invalid Substack feed: ${field} must use HTTP or HTTPS.`);
  }
  return url.toString();
}

function normalizeTimestamp(value: string, field: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Invalid Substack feed: ${field} is not a valid date.`);
  }
  return date.toISOString();
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function deriveSlug(sourceUrl: string, title: string, sourceId: string): string {
  const url = new URL(sourceUrl);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const postSegment =
    pathSegments[0] === "p" && pathSegments[1]
      ? decodeURIComponent(pathSegments[1])
      : undefined;
  const candidate = slugify(postSegment ?? title);
  if (candidate) {
    return candidate;
  }

  const suffix = createHash("sha256").update(sourceId).digest("hex").slice(0, 12);
  return `post-${suffix}`;
}

function plainText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const text = sanitizeHtml(value, {
    allowedAttributes: {},
    allowedTags: [],
  }).trim();
  return text ? decode(text) : undefined;
}

export function sanitizeSubstackHtml(html: string): string {
  const sanitized = sanitizeHtml(html, {
    allowedAttributes: {
      a: ["href", "name", "rel", "target", "title"],
      div: ["class"],
      figcaption: ["class"],
      figure: ["class"],
      img: [
        "alt",
        "height",
        "loading",
        "sizes",
        "src",
        "srcset",
        "title",
        "width",
      ],
      p: ["class"],
      picture: ["class"],
      source: ["media", "sizes", "src", "srcset", "type"],
      span: ["class"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedTags: ALLOWED_HTML_TAGS,
    exclusiveFilter: (frame) => {
      if (frame.tag !== "p") {
        return false;
      }
      return (frame.attribs.class ?? "")
        .split(/\s+/)
        .includes("button-wrapper");
    },
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target !== "_blank") {
          return { attribs, tagName };
        }
        const rel = new Set((attribs.rel ?? "").split(/\s+/).filter(Boolean));
        rel.add("noopener");
        rel.add("noreferrer");
        return {
          attribs: { ...attribs, rel: [...rel].sort().join(" ") },
          tagName,
        };
      },
    },
  }).trim();

  const bodyText = sanitizeHtml(sanitized, {
    allowedAttributes: {},
    allowedTags: [],
  }).trim();
  if (!bodyText && !sanitized.includes("<img")) {
    throw new Error(
      "Invalid Substack feed: content:encoded has no meaningful article body.",
    );
  }
  return sanitized;
}

function parseCoverImage(item: Record<string, unknown>): ArchiveMedia[] {
  const rawEnclosure = Array.isArray(item.enclosure)
    ? item.enclosure[0]
    : item.enclosure;
  if (!isRecord(rawEnclosure)) {
    return [];
  }

  const rawUrl = rawEnclosure["@_url"];
  if (typeof rawUrl !== "string" || rawUrl.trim() === "") {
    return [];
  }

  return [
    {
      mediaType: "IMAGE",
      mediaUrl: normalizeHttpUrl(rawUrl, "item.enclosure.url"),
    },
  ];
}

function normalizeItem(value: unknown, index: number): SubstackPost {
  if (!isRecord(value)) {
    throw new Error(`Invalid Substack feed: item ${index} must be an object.`);
  }

  const title = requireText(value.title, `item ${index} title`);
  const sourceUrl = normalizeHttpUrl(
    requireText(value.link, `item ${index} link`),
    `item ${index} link`,
  );
  const sourceId =
    optionalText(value.guid) ??
    sourceUrl;
  const rawBody = extractText(value["content:encoded"]);
  if (!rawBody?.trim()) {
    throw new Error(
      `Invalid Substack feed: item "${sourceId}" has no content:encoded body; refusing to archive an incomplete article.`,
    );
  }

  const author = optionalText(value["dc:creator"]);
  const description = plainText(optionalText(value.description));
  const post: SubstackPost = {
    id: `substack:${sourceId}`,
    source: "substack",
    sourceId,
    sourceUrl,
    slug: deriveSlug(sourceUrl, title, sourceId),
    title,
    publishedAt: normalizeTimestamp(
      requireText(value.pubDate, `item ${index} pubDate`),
      `item ${index} pubDate`,
    ),
    bodyHtml: sanitizeSubstackHtml(rawBody),
    media: parseCoverImage(value),
    metadata: {
      ...(author ? { author } : {}),
    },
    ...(description !== undefined ? { description } : {}),
  };
  return post;
}

export function parseSubstackFeed(xml: string): SubstackPost[] {
  let parsed: unknown;
  try {
    parsed = XML_PARSER.parse(xml);
  } catch (error) {
    throw new Error("Substack feed is not valid XML.", { cause: error });
  }

  if (!isRecord(parsed) || !isRecord(parsed.rss)) {
    throw new Error("Invalid Substack feed: missing rss root.");
  }
  const channel = parsed.rss.channel;
  if (!isRecord(channel)) {
    throw new Error("Invalid Substack feed: missing channel.");
  }

  const items =
    channel.item === undefined
      ? []
      : Array.isArray(channel.item)
        ? channel.item
        : [channel.item];
  return items.map(normalizeItem);
}

export async function fetchSubstackPosts(
  fetchImpl: typeof fetch = fetch,
): Promise<SubstackPost[]> {
  let response: Response;
  try {
    response = await fetchImpl(SUBSTACK_FEED_URL, {
      headers: {
        accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8",
        "user-agent": "EveryWoman content synchronizer",
      },
    });
  } catch (error) {
    throw new Error("Unable to fetch the public Substack RSS feed.", {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new Error(
      `Substack feed request failed with HTTP ${response.status}.`,
    );
  }
  return parseSubstackFeed(await response.text());
}
