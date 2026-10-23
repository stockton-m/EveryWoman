import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  closeExperimentalParser,
  isExperimentalSource,
  sourceSyntaxError,
  stripExperimentalImports,
  withExperimentalSourceExclusions,
} from "../strip.ts";

after(() => {
  closeExperimentalParser();
});

const REPOSITORY_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

test("isExperimentalSource accepts only the directive as the first non-empty line", () => {
  assert.equal(isExperimentalSource("// @experimental\nexport {}\n"), true);
  assert.equal(isExperimentalSource("\n\n// @experimental\n"), true);
  assert.equal(isExperimentalSource("import { Widget } from './Widget'\n"), false);
  assert.equal(isExperimentalSource("// @experimental extra\n"), false);
});

test("stripExperimentalImports removes an experimental component and keeps the rest", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "experimental-"));
  try {
    const componentDir = path.join(root, "src", "app", "components");
    const pageDir = path.join(root, "src", "app", "pages");
    await mkdir(componentDir, { recursive: true });
    await mkdir(pageDir, { recursive: true });
    await writeFile(
      path.join(componentDir, "Widget.tsx"),
      "// @experimental\nexport function Widget() { return null }\n",
    );
    await writeFile(
      path.join(componentDir, "SiteNav.tsx"),
      "export function SiteNav() { return null }\n",
    );
    const importer = path.join(pageDir, "ServicesPage.tsx");
    const source = `import { SiteNav } from "@/app/components/SiteNav";
import { Widget } from "@/app/components/Widget";
import type { Widget as WidgetType } from "@/app/components/Widget";

export function ServicesPage() {
  return (
    <div>
      <SiteNav />
      <Widget />
      <Widget>
        <p>Secret experimental copy</p>
      </Widget>
      <p>Disclaimer</p>
    </div>
  );
}
`;
    await writeFile(importer, source);

    const stripped = stripExperimentalImports(source, importer, root);
    assert.equal(stripped.includes("Secret experimental copy"), false);
    assert.equal(stripped.includes("<Widget"), false);
    assert.match(stripped, /import \{ SiteNav \} from "@\/app\/components\/SiteNav";/);
    assert.match(
      stripped,
      /import type \{ Widget as WidgetType \} from "@\/app\/components\/Widget";/,
    );
    assert.match(stripped, /<SiteNav \/>/);
    assert.match(stripped, /<p>Disclaimer<\/p>/);
    assert.equal(sourceSyntaxError(stripped), "");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stripExperimentalImports removes a relative experimental import", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "experimental-"));
  try {
    const pageDir = path.join(root, "src", "app", "pages");
    await mkdir(path.join(root, "src", "app", "components"), { recursive: true });
    await mkdir(pageDir, { recursive: true });
    await writeFile(
      path.join(root, "src", "app", "components", "Widget.tsx"),
      "// @experimental\nexport function Widget() { return null }\n",
    );
    const importer = path.join(pageDir, "Page.tsx");
    const source = `import { Widget as Marquee } from "../components/Widget";

export function Page() {
  return <Marquee />;
}
`;
    const stripped = stripExperimentalImports(source, importer, root);
    assert.equal(stripped.includes("Marquee"), false);
    assert.equal(stripped.includes("Widget"), false);
    assert.equal(sourceSyntaxError(stripped), "");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("strips the services page testimonials section", async () => {
  const importer = path.join(REPOSITORY_ROOT, "src", "app", "pages", "ServicesPage.tsx");
  const source = await readFile(importer, "utf8");
  const stripped = stripExperimentalImports(source, importer, REPOSITORY_ROOT);
  assert.equal(stripped.includes("TestimonialMarquee"), false);
  assert.match(stripped, /SiteNav/);
  assert.match(stripped, /Coaching tiers/);
  assert.match(stripped, /COACHING_DISCLAIMER_PREFIX/);
  assert.equal(sourceSyntaxError(stripped), "");
});

test("strips the benefit detail modal from the coaching tier grid", async () => {
  const importer = path.join(REPOSITORY_ROOT, "src", "app", "components", "TierComparisonGrid.tsx");
  const source = await readFile(importer, "utf8");
  const stripped = stripExperimentalImports(source, importer, REPOSITORY_ROOT);
  assert.equal(stripped.includes("BenefitDetailModal"), false);
  assert.match(stripped, /BenefitCell/);
  assert.match(stripped, /onMouseEnter/);
  assert.match(stripped, /onMouseLeave/);
  assert.match(stripped, /onBenefitClick/);
  assert.equal(sourceSyntaxError(stripped), "");
});

test("excludes experimental modules from the tailwind source scan", async () => {
  const cssFile = path.join(REPOSITORY_ROOT, "src", "styles", "tailwind.css");
  const css = await readFile(cssFile, "utf8");
  const next = withExperimentalSourceExclusions(css, REPOSITORY_ROOT, cssFile);
  assert.match(next, /@source not '\.\.\/app\/components\/TestimonialMarquee\.tsx';/);
  assert.match(next, /@source not '\.\.\/app\/components\/BenefitDetailModal\.tsx';/);
  assert.equal(
    withExperimentalSourceExclusions(next, REPOSITORY_ROOT, cssFile),
    next,
  );
});
