import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { writeSeoBuild } from "../generate.ts";

const TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!-- seo:head -->
    <title>Placeholder</title>
    <!-- /seo:head -->
  </head>
  <body>
    <div id="root"></div>
    <noscript><!-- seo:body --></noscript>
  </body>
</html>
`;

const archive = {
  posts: [
    {
      id: "instagram:1",
      source: "instagram",
      sourceUrl: "https://www.instagram.com/p/example/",
    },
    {
      bodyHtml: "<p>Skipped.</p>",
      slug: "../secret",
      source: "substack",
      title: "Path traversal",
    },
    {
      description: "Missing a body",
      slug: "no-body",
      source: "substack",
      title: "No body",
    },
    {
      bodyHtml: "<p>Body &amp; more</p>",
      description: "A short <essay>",
      metadata: { author: "Madeleine Stockton" },
      publishedAt: "2026-05-22T11:03:28.000Z",
      slug: "hello-world",
      source: "substack",
      title: "Hello & World",
    },
  ],
};

test("generator writes sitemap, page metadata, article HTML, and a noindex 404", async () => {
  const outDir = await mkdtemp(path.join(tmpdir(), "everywoman-seo-"));

  try {
    writeSeoBuild({ archive, html: TEMPLATE, outDir });

    const sitemap = await readFile(path.join(outDir, "sitemap.xml"), "utf8");
    for (const url of [
      "https://everywoman.io/",
      "https://everywoman.io/about/",
      "https://everywoman.io/services/",
      "https://everywoman.io/contact/",
      "https://everywoman.io/posts/",
      "https://everywoman.io/posts/hello-world/",
    ]) {
      assert.match(sitemap, new RegExp(`<loc>${url}</loc>`));
    }
    assert.match(
      sitemap,
      /<loc>https:\/\/everywoman\.io\/posts\/hello-world\/<\/loc>\s*<lastmod>2026-05-22<\/lastmod>/,
    );
    assert.doesNotMatch(sitemap, /instagram|no-body|secret|404/);

    const about = await readFile(path.join(outDir, "about/index.html"), "utf8");
    assert.match(about, /<title>About · EveryWoman<\/title>/);
    assert.match(
      about,
      /<link rel="canonical" href="https:\/\/everywoman\.io\/about\/" \/>/,
    );
    assert.match(about, /<meta name="robots" content="index, follow" \/>/);
    assert.match(about, /property="og:title" content="About · EveryWoman"/);
    assert.match(about, /property="og:type" content="website"/);
    assert.match(about, /property="og:url" content="https:\/\/everywoman\.io\/about\/"/);
    assert.match(about, /property="og:image" content="https:\/\/everywoman\.io\/og\.png"/);
    assert.match(about, /property="og:image:width" content="1200"/);
    assert.match(about, /property="og:image:height" content="630"/);
    assert.match(about, /name="twitter:card" content="summary_large_image"/);
    assert.match(about, /name="twitter:image" content="https:\/\/everywoman\.io\/og\.png"/);
    const aboutLd = jsonLd(about) as { ["@type"]: string; name: string };
    assert.equal(aboutLd["@type"], "Person");
    assert.equal(aboutLd.name, "Madeleine Stockton");
    assert.match(about, /<div id="root"><\/div>\s*<noscript><main><h1>Madeleine<\/h1>/);

    const article = await readFile(
      path.join(outDir, "posts/hello-world/index.html"),
      "utf8",
    );
    assert.match(article, /<title>Hello &amp; World · EveryWoman<\/title>/);
    assert.match(article, /property="og:type" content="article"/);
    assert.match(article, /property="og:description" content="A short &lt;essay&gt;"/);
    assert.match(
      article,
      /property="article:published_time" content="2026-05-22T11:03:28.000Z"/,
    );
    assert.match(article, /name="twitter:title" content="Hello &amp; World · EveryWoman"/);
    assert.doesNotMatch(article, /noindex/);
    const articleLd = jsonLd(article) as {
      ["@type"]: string;
      description: string;
      headline: string;
      image: string;
    };
    assert.equal(articleLd["@type"], "BlogPosting");
    assert.equal(articleLd.headline, "Hello & World");
    assert.equal(articleLd.description, "A short <essay>");
    assert.equal(articleLd.image, "https://everywoman.io/og.png");
    assert.match(
      article,
      /<div id="root"><\/div>\s*<noscript><main><article><p>Substack<\/p><h1>Hello &amp; World<\/h1>/,
    );
    assert.match(article, /<noscript>[\s\S]*<p>Body &amp; more<\/p>[\s\S]*<\/noscript>/);

    const notFound = await readFile(path.join(outDir, "404.html"), "utf8");
    assert.match(notFound, /<meta name="robots" content="noindex, nofollow" \/>/);
    assert.match(notFound, /<title>Page not found · EveryWoman<\/title>/);
    assert.doesNotMatch(notFound, /hello-world/);

    const llms = await readFile(path.join(outDir, "llms.txt"), "utf8");
    assert.match(llms, /# EveryWoman/);
    assert.match(llms, /endometriosis, PMOS, pre\/postpartum recovery/);
    assert.match(llms, /NASM Certified Personal Trainer/);
    assert.match(llms, /Coaching is not medical care/);
    assert.match(llms, /ARE YOU AN AGENT\?/);
    assert.match(
      llms,
      /\* \[About\]\(https:\/\/everywoman\.io\/about\.md\) for information on Madeleine's background and her story/,
    );
    assert.match(
      llms,
      /\* \[Posts\]\(https:\/\/everywoman\.io\/posts\.md\) for essays and social media posts/,
    );
    assert.match(
      llms,
      /- \[Hello & World\]\(https:\/\/everywoman\.io\/posts\/hello-world\.md\): A short <essay>/,
    );
    assert.doesNotMatch(llms, /instagram|no-body|secret/);
    assert.doesNotMatch(llms, /posts\/hello-world\/\)/);

    for (const [file, markdown] of [
      ["index.html", "https://everywoman.io/index.md"],
      ["about/index.html", "https://everywoman.io/about.md"],
      ["services/index.html", "https://everywoman.io/services.md"],
      ["contact/index.html", "https://everywoman.io/contact.md"],
      ["posts/index.html", "https://everywoman.io/posts.md"],
      ["posts/hello-world/index.html", "https://everywoman.io/posts/hello-world.md"],
    ] as const) {
      const html = await readFile(path.join(outDir, file), "utf8");
      assert.match(
        html,
        /<link rel="describedby" href="https:\/\/everywoman\.io\/llms\.txt" \/>/,
      );
      assert.match(
        html,
        new RegExp(
          `<link rel="alternate" type="text/markdown" href="${markdown.replaceAll(".", "\\.")}" />`,
        ),
      );
    }

    const services = await readFile(path.join(outDir, "services/index.html"), "utf8");
    const servicesNoscript = services.match(/<noscript>([\s\S]*)<\/noscript>/)?.[1] ?? "";
    assert.match(servicesNoscript, /endometriosis/);
    assert.match(servicesNoscript, /Foundation/);
    assert.match(servicesNoscript, /Signature/);
    assert.match(servicesNoscript, /Elevated/);
    assert.match(servicesNoscript, /not a substitute for medical care/);
    assert.match(servicesNoscript, /everywoman\.io@gmail\.com/);
    const servicesLd = jsonLd(services) as { description: string };
    assert.match(servicesLd.description, /endometriosis/);
    assert.match(servicesLd.description, /Foundation, Signature, and Elevated/);

    const servicesMarkdown = await readFile(path.join(outDir, "services.md"), "utf8");
    assert.match(servicesMarkdown, /endometriosis/);
    assert.match(servicesMarkdown, /### Foundation/);
    assert.match(servicesMarkdown, /### Signature/);
    assert.match(servicesMarkdown, /### Elevated/);
    assert.match(servicesMarkdown, /NASM/);
    assert.match(servicesMarkdown, /everywoman\.io@gmail\.com/);
    assert.match(servicesMarkdown, /Custom strength program designed for your goals/);

    const articleMarkdown = await readFile(
      path.join(outDir, "posts/hello-world.md"),
      "utf8",
    );
    assert.match(articleMarkdown, /Body & more/);
    assert.doesNotMatch(articleMarkdown, /<p>/);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("robots.txt allows training and search crawlers", async () => {
  const robots = await readFile(new URL("../../../public/robots.txt", import.meta.url), "utf8");
  assert.match(robots, /User-agent: \*\s+Allow: \//);
  assert.match(robots, /User-agent: GPTBot\s+Allow: \//);
  assert.match(robots, /User-agent: ClaudeBot\s+Allow: \//);
  assert.match(robots, /User-agent: OAI-SearchBot\s+Allow: \//);
  assert.match(robots, /User-agent: Claude-SearchBot\s+Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/everywoman\.io\/sitemap\.xml/);
  assert.doesNotMatch(robots, /Disallow/);

  const source = await readFile(new URL("../../../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(source, /noindex/);
  assert.match(source, /content="index, follow"/);

  const headers = await readFile(new URL("../../../public/_headers", import.meta.url), "utf8");
  assert.match(headers, /Link: <\/llms\.txt>; rel="describedby"/);
  assert.match(headers, /Content-Type: text\/markdown; charset=utf-8/);
  assert.match(headers, /X-Robots-Tag: noindex/);
});

function jsonLd(html: string): unknown {
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  assert.ok(match?.[1], "expected a JSON-LD script");
  return JSON.parse(match[1]);
}
