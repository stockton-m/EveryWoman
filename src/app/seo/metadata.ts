import {
  CONSULTATION_URL,
  CONTACT_INTRO,
  EMAIL_ADDRESS,
  INSTAGRAM_URL,
  SUBSTACK_URL,
  TIKTOK_URL,
} from "../constants";
import {
  ABOUT_BACKGROUND,
  ABOUT_COLLAGE_ITEMS,
  ABOUT_ETHOS_INTRO,
  ABOUT_PROFILES,
} from "../content/about";
import {
  COACHING_BENEFITS,
  COACHING_DISCLAIMER_PREFIX,
  COACHING_DISCLAIMER_SUFFIX,
  COACHING_INTRO_PARAGRAPHS,
  COACHING_TIERS,
  NASM_URL,
  type CoachingTierId,
  type TierBenefitCopy,
} from "../content/coaching";

export const SITE_URL = "https://everywoman.io";
export const SITE_NAME = "EveryWoman";
export const FOUNDER_NAME = "Madeleine Stockton";
export const OG_IMAGE_URL = `${SITE_URL}/og.png`;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const HOME_DESCRIPTION =
  "Strength training and movement for women navigating endometriosis, PMOS, pre/postpartum recovery, and hormonal transitions.";
export const OG_IMAGE_ALT = `${SITE_NAME}. ${HOME_DESCRIPTION}`;

const ABOUT_DESCRIPTION =
  "Madeleine Stockton founded EveryWoman, strength training and movement for women navigating endometriosis, PMOS, pre/postpartum recovery, and hormonal transitions.";
const SERVICES_DESCRIPTION =
  "Strength training built for your body, your health, and your life.";
const CONTACT_DESCRIPTION =
  "Reach Madeleine Stockton by email, or find EveryWoman on Substack, Instagram, and TikTok.";
const POSTS_DESCRIPTION =
  "Essays, Instagram, and TikTok from EveryWoman.";
const NOT_FOUND_TITLE = `Page not found · ${SITE_NAME}`;
const NOT_FOUND_DESCRIPTION =
  "The link may be out of date, or the page may have moved.";
const ARTICLE_DESCRIPTION_FALLBACK = "An essay from EveryWoman.";
const SERVICE_SCHEMA_DESCRIPTION =
  "Strength training coaching for women navigating endometriosis, PMOS, pre/postpartum recovery, and hormonal transitions. Tiers are Foundation, Signature, and Elevated. Coaching is from a NASM Certified Personal Trainer and is not a substitute for medical care.";
const FACTS_PATHS = new Set(["/", "/about", "/services", "/contact"]);
const LLMS_PAGE_NOTES: Record<string, string> = {
  "/": `${HOME_DESCRIPTION} Includes coaching tiers, credentials, and how to get in touch.`,
  "/about": "Madeleine Stockton's story.",
  "/services":
    "Who coaching is for, and the Foundation, Signature, and Elevated tiers.",
  "/contact": "Email Madeleine Stockton, or book a free consultation.",
  "/posts":
    "Essays on endometriosis, pelvic health, and training, plus Instagram and TikTok.",
};

const SAME_AS = [SUBSTACK_URL, INSTAGRAM_URL, TIKTOK_URL];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEAD_START = "<!-- seo:head -->";
const HEAD_END = "<!-- /seo:head -->";
const BODY_MARK = "<!-- seo:body -->";

export type SeoArticle = {
  author?: string;
  bodyHtml: string;
  description: string;
  publishedAt: string;
  slug: string;
  title: string;
};

export type SeoPage = {
  crawlableHtml: string;
  description: string;
  documentTitle: string;
  jsonLd: unknown;
  path: string;
  publishedAt?: string;
  robots: string;
  type: "article" | "website";
};

export type ArchiveInput = {
  posts?: unknown[];
};

type StaticPageCopy = {
  description: string;
  documentTitle: string;
  headlineHtml: string;
  jsonLd: unknown;
  path: string;
};

export function articlesFromArchive(archive: ArchiveInput): SeoArticle[] {
  const articles: SeoArticle[] = [];
  const seen = new Set<string>();

  for (const entry of archive.posts ?? []) {
    if (!isRecord(entry) || entry.source !== "substack") continue;
    if (typeof entry.slug !== "string" || !SLUG_PATTERN.test(entry.slug)) continue;
    if (typeof entry.title !== "string" || entry.title.trim() === "") continue;
    if (typeof entry.bodyHtml !== "string") continue;
    if (seen.has(entry.slug)) continue;
    seen.add(entry.slug);

    const metadata = isRecord(entry.metadata) ? entry.metadata : undefined;
    const author =
      typeof metadata?.author === "string" ? metadata.author.trim() : "";

    articles.push({
      author: author || undefined,
      bodyHtml: entry.bodyHtml,
      description:
        typeof entry.description === "string" ? entry.description.trim() : "",
      publishedAt:
        typeof entry.publishedAt === "string" ? entry.publishedAt : "",
      slug: entry.slug,
      title: entry.title.trim(),
    });
  }

  articles.sort((a, b) => publishedTime(b.publishedAt) - publishedTime(a.publishedAt));
  return articles;
}

export function indexablePages(articles: SeoArticle[]): SeoPage[] {
  return [...staticPages(articles), ...articles.map(articlePage)];
}

export function pageForPath(pathname: string, articles: SeoArticle[]): SeoPage {
  const path = normalizePath(pathname);
  const staticPage = staticPages(articles).find((page) => page.path === path);
  if (staticPage) return staticPage;

  const slug = slugFromPath(path);
  if (slug) {
    const article = articles.find((item) => item.slug === slug);
    if (article) return articlePage(article);
  }

  return notFoundPage();
}

export function notFoundPage(): SeoPage {
  return {
    crawlableHtml: crawlableSummary("Page not found", NOT_FOUND_DESCRIPTION),
    description: NOT_FOUND_DESCRIPTION,
    documentTitle: NOT_FOUND_TITLE,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Page not found",
      description: NOT_FOUND_DESCRIPTION,
    },
    path: "/",
    robots: "noindex, nofollow",
    type: "website",
  };
}

export function slugFromPath(pathname: string): string | undefined {
  const path = normalizePath(pathname);
  if (!path.startsWith("/posts/")) return undefined;
  const slug = path.slice("/posts/".length);
  if (!slug || slug.includes("/")) return undefined;
  return slug;
}

export function titleForPath(pathname: string, articleTitle?: string): string {
  const slug = slugFromPath(pathname);
  const articles =
    slug && articleTitle
      ? [
          {
            bodyHtml: "",
            description: "",
            publishedAt: "",
            slug,
            title: articleTitle,
          },
        ]
      : [];
  return pageForPath(pathname, articles).documentTitle;
}

export function applySeo(html: string, page: SeoPage): string {
  const headStart = html.indexOf(HEAD_START);
  const headEnd = html.indexOf(HEAD_END);
  if (headStart < 0 || headEnd < headStart || !html.includes(BODY_MARK)) {
    throw new Error("index.html is missing SEO markers");
  }

  const head = renderHead(page)
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
  const withHead = `${html.slice(0, headStart + HEAD_START.length)}\n${head}\n    ${html.slice(headEnd)}`;
  const bodyAt = withHead.indexOf(BODY_MARK);
  return `${withHead.slice(0, bodyAt)}${page.crawlableHtml}${withHead.slice(bodyAt + BODY_MARK.length)}`;
}

export function renderSitemap(pages: SeoPage[]): string {
  const urls = pages.map((page) => {
    const lastmod = page.publishedAt
      ? `\n    <lastmod>${page.publishedAt.slice(0, 10)}</lastmod>`
      : "";
    return `  <url>\n    <loc>${escapeHtml(canonicalUrl(page.path))}</loc>${lastmod}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function renderLlmsTxt(articles: SeoArticle[]): string {
  const pages = staticPages(articles);
  const pageLines = pages.map(
    (page) =>
      `- [${linkText(page.documentTitle)}](${markdownUrl(page.path)}): ${LLMS_PAGE_NOTES[page.path] ?? oneLine(page.description)}`,
  );
  const articleLines = articles.map((article) => {
    const description = article.description || ARTICLE_DESCRIPTION_FALLBACK;
    return `- [${linkText(article.title)}](${markdownUrl(`/posts/${article.slug}`)}): ${oneLine(description)}`;
  });

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${HOME_DESCRIPTION}`,
    "",
    `${FOUNDER_NAME} coaches strength training for women with endometriosis, PMOS, pre/postpartum recovery, and hormonal transitions. She is a NASM Certified Personal Trainer. Coaching is not medical care.`,
    "",
    "ARE YOU AN AGENT?",
    "Most content of the site is mirrored in markdown for your ease of access. Where to look:",
    `* [Coaching services](${markdownUrl("/services")}) for who it is for and the three tiers`,
    `* [About](${markdownUrl("/about")}) for information on Madeleine's background and her story`,
    `* [Contact](${markdownUrl("/contact")}) for email and the free consultation`,
    `* [Posts](${markdownUrl("/posts")}) for essays and social media posts`,
    "",
    "## Pages",
    "",
    ...pageLines,
    "",
    "## Articles",
    "",
    ...articleLines,
    "",
  ].join("\n");
}

export function markdownUrl(pagePath: string): string {
  if (pagePath === "/") return `${SITE_URL}/index.md`;
  return `${SITE_URL}${pagePath}.md`;
}

export function markdownForUrl(url: string, articles: SeoArticle[]): string | undefined {
  const pathOnly = url.split("?")[0]?.split("#")[0] ?? "";
  if (!pathOnly.endsWith(".md")) return undefined;
  const stem = pathOnly.slice(0, -".md".length).replace(/\/$/, "");
  const pagePath = stem === "/index" ? "/" : normalizePath(stem);
  const page = pageForPath(pagePath, articles);
  if (page.robots.includes("noindex")) return undefined;
  if (markdownUrl(page.path) !== `${SITE_URL}${pathOnly}`) return undefined;
  return renderPageMarkdown(page, articles);
}

export function renderPageMarkdown(page: SeoPage, articles: SeoArticle[]): string {
  if (page.type === "article") return articleMarkdown(page, articles);

  const lines = [
    `# ${linkText(page.documentTitle)}`,
    "",
    `> ${oneLine(page.description)}`,
    "",
    `Markdown alternate of ${canonicalUrl(page.path)}.`,
    "",
  ];

  if (page.path === "/about") lines.push(aboutStoryMarkdown(), "");
  if (page.path === "/contact") lines.push(contactLeadMarkdown(), "");
  if (page.path === "/posts") lines.push(postsIndexMarkdown(articles), "");
  if (FACTS_PATHS.has(page.path)) {
    lines.push(coachingFactsMarkdown({ benefits: page.path === "/services" }));
  }

  return `${lines.join("\n").trim()}\n`;
}

function staticPages(articles: SeoArticle[]): SeoPage[] {
  return STATIC_PAGE_COPY.map((page) => ({
    crawlableHtml: crawlablePageHtml(page, articles),
    description: page.description,
    documentTitle: page.documentTitle,
    jsonLd: page.jsonLd,
    path: page.path,
    robots: "index, follow",
    type: "website",
  }));
}

const STATIC_PAGE_COPY: StaticPageCopy[] = [
  {
    path: "/",
    documentTitle: SITE_NAME,
    headlineHtml: "Your diagnosis <em>isn't your ceiling.</em>",
    description: HOME_DESCRIPTION,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          logo: OG_IMAGE_URL,
          email: EMAIL_ADDRESS,
          founder: {
            "@type": "Person",
            name: FOUNDER_NAME,
          },
          sameAs: SAME_AS,
        },
        {
          "@type": "WebSite",
          name: SITE_NAME,
          url: `${SITE_URL}/`,
        },
      ],
    },
  },
  {
    path: "/about",
    documentTitle: `About · ${SITE_NAME}`,
    headlineHtml: "Madeleine",
    description: ABOUT_DESCRIPTION,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: FOUNDER_NAME,
      url: `${SITE_URL}/about/`,
      jobTitle: "Founder",
      worksFor: {
        "@type": "Organization",
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
      email: EMAIL_ADDRESS,
      sameAs: SAME_AS,
    },
  },
  {
    path: "/services",
    documentTitle: `Coaching Services · ${SITE_NAME}`,
    headlineHtml: "Coaching Services",
    description: SERVICES_DESCRIPTION,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "EveryWoman coaching",
      serviceType: "Strength training coaching",
      description: SERVICE_SCHEMA_DESCRIPTION,
      url: `${SITE_URL}/services/`,
      provider: {
        "@type": "Organization",
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
    },
  },
  {
    path: "/contact",
    documentTitle: `Contact · ${SITE_NAME}`,
    headlineHtml: "Contact me",
    description: CONTACT_DESCRIPTION,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact",
      url: `${SITE_URL}/contact/`,
      description: CONTACT_DESCRIPTION,
      mainEntity: {
        "@type": "Organization",
        name: SITE_NAME,
        email: EMAIL_ADDRESS,
        url: `${SITE_URL}/`,
      },
    },
  },
  {
    path: "/posts",
    documentTitle: `Posts · ${SITE_NAME}`,
    headlineHtml: "Recent posts",
    description: POSTS_DESCRIPTION,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Posts",
      url: `${SITE_URL}/posts/`,
      description: POSTS_DESCRIPTION,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
    },
  },
];

function articlePage(article: SeoArticle): SeoPage {
  const description = article.description || ARTICLE_DESCRIPTION_FALLBACK;
  const publishedAt = validTimestamp(article.publishedAt);
  const dateLabel = publishedAt ? formatPublishedDate(publishedAt) : "";
  const byline = article.author?.trim();
  const meta = dateLabel
    ? `<p><time datetime="${escapeHtml(publishedAt ?? "")}">${escapeHtml(dateLabel)}</time>${byline ? ` · ${escapeHtml(byline)}` : ""}</p>`
    : "";

  return {
    crawlableHtml: `<main><article><p>Substack</p><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(description)}</p>${meta}${article.bodyHtml}</article></main>`,
    description,
    documentTitle: `${article.title} · ${SITE_NAME}`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description,
      ...(publishedAt ? { datePublished: publishedAt } : {}),
      author: {
        "@type": "Person",
        name: articleAuthor(article.author),
      },
      url: canonicalUrl(`/posts/${article.slug}`),
      image: OG_IMAGE_URL,
      mainEntityOfPage: canonicalUrl(`/posts/${article.slug}`),
    },
    path: `/posts/${article.slug}`,
    publishedAt,
    robots: "index, follow",
    type: "article",
  };
}

function articleAuthor(author: string | undefined): string {
  if (!author || author.toLowerCase() === "everywoman") return FOUNDER_NAME;
  return author;
}

function crawlableSummary(headlineHtml: string, description: string): string {
  return `<main><h1>${headlineHtml}</h1><p>${escapeHtml(description)}</p></main>`;
}

function crawlablePageHtml(page: StaticPageCopy, articles: SeoArticle[]): string {
  const chunks = [
    `<h1>${page.headlineHtml}</h1>`,
    `<p>${escapeHtml(page.description)}</p>`,
  ];
  if (page.path === "/about") chunks.push(aboutStoryHtml());
  if (page.path === "/contact") chunks.push(contactLeadHtml());
  if (page.path === "/posts") chunks.push(postsIndexHtml(articles));
  if (FACTS_PATHS.has(page.path)) {
    chunks.push(coachingFactsHtml({ benefits: page.path === "/services" }));
  }
  return `<main>${chunks.join("")}</main>`;
}

function coachingFactsHtml(options: { benefits: boolean }): string {
  const tiers = COACHING_TIERS.map((tier) => {
    const benefits = options.benefits
      ? `<ul>${tierBenefitTexts(tier.id)
          .map((benefit) => `<li>${escapeHtml(benefit)}</li>`)
          .join("")}</ul>`
      : "";
    return `<section><h3>${escapeHtml(tier.name)}</h3><p>${escapeHtml(tier.tagline)}</p>${tier.intro
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("")}${benefits}</section>`;
  }).join("");

  return [
    "<section>",
    "<h2>Who this coaching is for</h2>",
    ...COACHING_INTRO_PARAGRAPHS.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    disclaimerHtml(),
    "<h2>Coaching tiers</h2>",
    tiers,
    "<h2>Contact</h2>",
    contactDetailsHtml(),
    "</section>",
  ].join("");
}

function coachingFactsMarkdown(options: { benefits: boolean }): string {
  const tiers = COACHING_TIERS.map((tier) => {
    const lines = [
      `### ${tier.name}`,
      "",
      tier.tagline,
      "",
      ...tier.intro.flatMap((paragraph) => [paragraph, ""]),
    ];
    if (options.benefits) {
      lines.push(...tierBenefitTexts(tier.id).map((benefit) => `- ${benefit}`), "");
    }
    return lines.join("\n").trim();
  }).join("\n\n");

  return [
    "## Who this coaching is for",
    "",
    ...COACHING_INTRO_PARAGRAPHS,
    "",
    disclaimerText(),
    "",
    "## Coaching tiers",
    "",
    tiers,
    "",
    "## Contact",
    "",
    contactDetailsMarkdown(),
  ].join("\n");
}

function aboutStoryHtml(): string {
  const lead = `${ABOUT_BACKGROUND.lead.before}<em>${escapeHtml(ABOUT_BACKGROUND.lead.emphasis)}</em>${escapeHtml(ABOUT_BACKGROUND.lead.after)}`;
  const paragraphs = [...ABOUT_BACKGROUND.left, ...ABOUT_BACKGROUND.right]
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  const profiles = ABOUT_PROFILES.map(
    (profile) =>
      `<section><h3>${escapeHtml(profile.name)}</h3><p>${escapeHtml(profile.role)}</p><p>${escapeHtml(profile.description)}</p></section>`,
  ).join("");
  const collage = ABOUT_COLLAGE_ITEMS.map(
    (item) =>
      `<li><strong>${escapeHtml(item.title)}</strong> ${escapeHtml(item.description)}</li>`,
  ).join("");
  return [
    "<section>",
    `<p>${lead}</p>`,
    paragraphs,
    `<p>${escapeHtml(ABOUT_BACKGROUND.signoff)}</p>`,
    `<p>${escapeHtml(ABOUT_ETHOS_INTRO)}</p>`,
    profiles,
    `<ul>${collage}</ul>`,
    "</section>",
  ].join("");
}

function aboutStoryMarkdown(): string {
  const lead = `${ABOUT_BACKGROUND.lead.before}${ABOUT_BACKGROUND.lead.emphasis}${ABOUT_BACKGROUND.lead.after}`;
  const profiles = ABOUT_PROFILES.map(
    (profile) => `### ${profile.name}\n\n${profile.role}\n\n${profile.description}`,
  ).join("\n\n");
  const collage = ABOUT_COLLAGE_ITEMS.map(
    (item) => `- **${item.title}** ${item.description}`,
  ).join("\n");
  return [
    "## Madeleine",
    "",
    lead,
    "",
    ABOUT_BACKGROUND.left.join("\n\n"),
    "",
    ABOUT_BACKGROUND.right.join("\n\n"),
    "",
    ABOUT_BACKGROUND.signoff,
    "",
    ABOUT_ETHOS_INTRO,
    "",
    profiles,
    "",
    collage,
  ].join("\n");
}

function contactLeadHtml(): string {
  return `<p>${escapeHtml(CONTACT_INTRO)}</p>`;
}

function contactLeadMarkdown(): string {
  return CONTACT_INTRO;
}

function contactDetailsHtml(): string {
  return [
    `<p>Email <a href="mailto:${escapeHtml(EMAIL_ADDRESS)}">${escapeHtml(EMAIL_ADDRESS)}</a></p>`,
    `<p><a href="${escapeHtml(CONSULTATION_URL)}">Free consultation</a></p>`,
    "<ul>",
    `<li><a href="${escapeHtml(SUBSTACK_URL)}">Substack</a></li>`,
    `<li><a href="${escapeHtml(INSTAGRAM_URL)}">Instagram</a></li>`,
    `<li><a href="${escapeHtml(TIKTOK_URL)}">TikTok</a></li>`,
    "</ul>",
  ].join("");
}

function contactDetailsMarkdown(): string {
  return [
    `- Email: [${EMAIL_ADDRESS}](mailto:${EMAIL_ADDRESS})`,
    `- Free consultation: ${CONSULTATION_URL}`,
    `- [Substack](${SUBSTACK_URL})`,
    `- [Instagram](${INSTAGRAM_URL})`,
    `- [TikTok](${TIKTOK_URL})`,
  ].join("\n");
}

function postsIndexHtml(articles: SeoArticle[]): string {
  if (articles.length === 0) return "";
  const items = articles
    .map(
      (article) =>
        `<li><a href="${escapeHtml(canonicalUrl(`/posts/${article.slug}`))}">${escapeHtml(article.title)}</a></li>`,
    )
    .join("");
  return `<section><h2>Articles</h2><ul>${items}</ul></section>`;
}

function postsIndexMarkdown(articles: SeoArticle[]): string {
  const items = articles.map((article) => {
    const description = article.description || ARTICLE_DESCRIPTION_FALLBACK;
    return `- [${linkText(article.title)}](${markdownUrl(`/posts/${article.slug}`)}): ${oneLine(description)}`;
  });
  return ["## Articles", "", ...items].join("\n");
}

function articleMarkdown(page: SeoPage, articles: SeoArticle[]): string {
  const slug = slugFromPath(page.path);
  const article = articles.find((item) => item.slug === slug);
  const published = page.publishedAt ? formatPublishedDate(page.publishedAt) : "";
  const author = articleAuthor(article?.author);
  const meta = [published, author].filter(Boolean).join(" · ");
  return [
    `# ${linkText(page.documentTitle.replace(` · ${SITE_NAME}`, ""))}`,
    "",
    `> ${oneLine(page.description)}`,
    "",
    `Markdown alternate of ${canonicalUrl(page.path)}.`,
    meta ? `\n${meta}\n` : "",
    article ? htmlToMarkdown(article.bodyHtml) : "",
    "",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .concat("\n");
}

function disclaimerHtml(): string {
  return `<p>${escapeHtml(COACHING_DISCLAIMER_PREFIX)}<a href="${escapeHtml(NASM_URL)}">NASM</a>${escapeHtml(COACHING_DISCLAIMER_SUFFIX)}</p>`;
}

function disclaimerText(): string {
  return `${COACHING_DISCLAIMER_PREFIX}NASM${COACHING_DISCLAIMER_SUFFIX}`;
}

function tierBenefitTexts(tierId: CoachingTierId): string[] {
  return COACHING_BENEFITS.flatMap((benefit) => {
    const copy = benefit[tierId];
    return copy ? [benefitPlainText(copy)] : [];
  });
}

function benefitPlainText(copy: TierBenefitCopy): string {
  if (copy.kind === "structured") return `${copy.title}: ${copy.description}`;
  if (copy.kind === "coachrx") return `${copy.before}CoachRx${copy.after}`;
  if ("text" in copy) return copy.text;
  return copy.parts.map((part) => part.text).join("");
}

function htmlToMarkdown(html: string): string {
  const withoutMedia = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    .replace(/<hr\s*\/?>/gi, "\n\n---\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<h([1-6])[^>]*>/gi, (_, level: string) => `\n\n${"#".repeat(Number(level))} `)
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/(p|div|blockquote|ul|ol)>/gi, "\n\n")
    .replace(/<(p|div|blockquote|ul|ol)[^>]*>/gi, "")
    .replace(
      /<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
      (_, href: string, label: string) => {
        const text = label.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        const target = decodeHtmlEntities(href);
        return text ? `[${text}](${target})` : target;
      },
    )
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(withoutMedia).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
}

function renderHead(page: SeoPage): string {
  const canonical = canonicalUrl(page.path);
  const tags = [
    `<title>${escapeHtml(page.documentTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<link rel="describedby" href="${escapeHtml(`${SITE_URL}/llms.txt`)}" />`,
    ...(page.robots.includes("noindex")
      ? []
      : [
          `<link rel="alternate" type="text/markdown" href="${escapeHtml(markdownUrl(page.path))}" />`,
        ]),
    `<meta name="robots" content="${page.robots}" />`,
    `<meta property="og:title" content="${escapeHtml(page.documentTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${page.type}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:image" content="${OG_IMAGE_URL}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(page.documentTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE_URL}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
  ];

  if (page.publishedAt) {
    tags.push(
      `<meta property="article:published_time" content="${escapeHtml(page.publishedAt)}" />`,
    );
  }

  tags.push(jsonLdScript(page.jsonLd));
  return tags.join("\n");
}

function jsonLdScript(data: unknown): string {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function canonicalUrl(pagePath: string): string {
  if (pagePath === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${pagePath}/`;
}

function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  let decoded = withoutQuery;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    decoded = withoutQuery;
  }
  if (!decoded.startsWith("/")) decoded = `/${decoded}`;
  if (decoded === "/index.html") return "/";
  if (decoded.length > 1 && decoded.endsWith("/")) decoded = decoded.slice(0, -1);
  return decoded || "/";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatPublishedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function validTimestamp(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return undefined;
  if (Number.isNaN(Date.parse(value))) return undefined;
  return value;
}

function publishedTime(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function linkText(value: string): string {
  return oneLine(value).replaceAll("[", "").replaceAll("]", "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
