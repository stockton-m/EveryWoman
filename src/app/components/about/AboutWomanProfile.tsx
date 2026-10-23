import { ArrowRight } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import {
  AboutInlines,
  flattenAboutParagraphs,
} from "@/app/components/about/AboutInlines";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import type { AboutInline } from "@/app/content/about";
import type { AboutProfileWithPortrait } from "@/app/content/aboutPortraits";
import { BLUSH, BROWN, CREAM, EMBER, MONO, SAGE, SERIF } from "@/app/constants";

export const ABOUT_ETHOS_CARD_STYLES = [
  { background: SAGE, color: CREAM },
  { background: BLUSH, color: BROWN },
  { background: EMBER, color: CREAM },
] as const;

export function getAboutEthosCardStyle(index: number) {
  return ABOUT_ETHOS_CARD_STYLES[index % ABOUT_ETHOS_CARD_STYLES.length];
}

type AboutEthosCardBodyProps = {
  profile: AboutProfileWithPortrait;
  onOpen: () => void;
};

const TRAILING_PUNCTUATION = /[\s,.;:!?…—–\-]+$/u;

function textNodes(root: HTMLElement) {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return (node as Text).parentElement?.closest(".about-ethos-card__more")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  let current: Node | null = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

function linkLabel(anchor: HTMLAnchorElement) {
  return [...anchor.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? "")
    .join("")
    .replace(/…/g, "")
    .trim();
}

/** Fit the preview to the card and let the ellipsis replace any trailing punctuation. */
function truncateCardDescription(root: HTMLElement, originals: Map<Text, string>) {
  const nodes = [...originals.keys()];

  const restore = () => {
    for (const [node, text] of originals) node.data = text;
    root.querySelectorAll("a").forEach((anchor) => {
      anchor.removeAttribute("hidden");
      anchor.style.display = "";
    });
  };

  const apply = (count: number, ellipsis: boolean, stripPunctuation: boolean) => {
    restore();
    let remaining = count;
    let last: Text | null = null;
    for (const node of nodes) {
      const original = originals.get(node) ?? "";
      if (remaining <= 0) {
        node.data = "";
        continue;
      }
      if (original.length <= remaining) {
        node.data = original;
        remaining -= original.length;
        if (original.length > 0) last = node;
      } else {
        node.data = original.slice(0, remaining);
        remaining = 0;
        last = node;
      }
    }
    if (ellipsis && last) {
      const trimmed = last.data.replace(
        stripPunctuation ? TRAILING_PUNCTUATION : /\s+$/u,
        "",
      );
      last.data = trimmed ? `${trimmed}…` : "…";
    }
    root.querySelectorAll("a").forEach((anchor) => {
      const visible = Boolean(linkLabel(anchor));
      anchor.toggleAttribute("hidden", !visible);
      anchor.style.display = visible ? "" : "none";
    });
  };

  const line = parseFloat(getComputedStyle(root).lineHeight) || 1;
  const allowed = Math.max(root.clientHeight, Math.round(root.clientHeight / line) * line);
  const fits = () => root.scrollHeight <= allowed + 1;

  const snapToWordBoundary = (count: number) => {
    const full = [...originals.values()].join("");
    if (count <= 0 || count >= full.length) return count;
    const previous = full[count - 1] ?? "";
    const next = full[count] ?? "";
    if (/\s/.test(previous) || next === "" || /\s/.test(next)) return count;
    const space = full.lastIndexOf(" ", count - 1);
    return space > 0 ? space : count;
  };

  restore();
  if (root.clientHeight === 0 || fits()) return;

  const total = [...originals.values()].reduce((sum, text) => sum + text.length, 0);
  let low = 0;
  let high = total;
  let best = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    apply(mid, true, false);
    if (fits()) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  apply(snapToWordBoundary(best), true, true);
}

function ClampedCardDescription({ paragraphs }: { paragraphs: AboutInline[][] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const originalsRef = useRef<{
    paragraphs: AboutInline[][];
    map: Map<Text, string>;
  } | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const nodes = textNodes(root);
    const saved = originalsRef.current;
    const reusable =
      saved?.paragraphs === paragraphs && nodes.every((node) => saved.map.has(node));
    if (!reusable) {
      originalsRef.current = {
        paragraphs,
        map: new Map(nodes.map((node) => [node, node.data])),
      };
    }
    const originals = originalsRef.current.map;

    let fitting = false;
    const fit = () => {
      if (fitting) return;
      fitting = true;
      const card = root.closest<HTMLElement>(".about-ethos-card");
      const more = card?.querySelector<HTMLElement>(".about-ethos-card__more");
      if (more) {
        const descBox = root.getBoundingClientRect();
        const circle = more.getBoundingClientRect();
        const overlap = Math.min(
          root.clientHeight,
          Math.max(0, descBox.bottom - circle.top + 6),
        );
        root.style.setProperty("--about-arrow-overlap", `${overlap}px`);
        root.style.setProperty(
          "--about-arrow-rest",
          `${Math.max(0, root.clientHeight - overlap)}px`,
        );
      }
      truncateCardDescription(root, originals);
      fitting = false;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(root);
    const card = root.closest(".about-ethos-card");
    if (card) observer.observe(card);
    let cancelled = false;
    if (document.fonts.status !== "loaded") {
      void document.fonts.ready.then(() => {
        if (!cancelled) fit();
      });
    }
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  });

  return (
    <p ref={ref} className="about-ethos-card__desc">
      <AboutInlines content={flattenAboutParagraphs(paragraphs)} />
    </p>
  );
}

export function AboutEthosCardBody({ profile, onOpen }: AboutEthosCardBodyProps) {
  return (
    <>
      <div className="about-ethos-card__media">
        <ImageWithFallback
          src={profile.cardImage}
          alt={profile.name}
          className={`about-ethos-card__image${profile.cardImageClassName ? ` ${profile.cardImageClassName}` : ""}`}
        />
      </div>

      <div className="about-ethos-card__copy">
        <p className="about-ethos-card__role" style={{ fontFamily: MONO }}>
          {profile.role}
        </p>
        <h3 className="about-ethos-card__name" style={{ fontFamily: SERIF }}>
          {profile.name}
        </h3>
        <ClampedCardDescription paragraphs={profile.paragraphs} />
      </div>
      <button
        type="button"
        className="about-ethos-card__more"
        aria-haspopup="dialog"
        aria-label={`Read more about ${profile.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
      >
        <span className="about-ethos-card__more-label">Read more</span>
        <ArrowRight className="about-ethos-card__arrow" aria-hidden="true" />
      </button>
    </>
  );
}

type AboutWomanProfileProps = {
  profile: AboutProfileWithPortrait;
  index: number;
  presented?: boolean;
  revealing?: boolean;
  onOpen: () => void;
};

export function AboutWomanProfile({
  profile,
  index,
  presented = false,
  revealing = false,
  onOpen,
}: AboutWomanProfileProps) {
  const cardStyle = getAboutEthosCardStyle(index);

  return (
    <article
      className={`about-ethos-card${presented ? " about-ethos-card--presented" : ""}${revealing ? " about-ethos-card--reveal" : ""}`}
      style={{ background: cardStyle.background, color: cardStyle.color }}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) return;
        onOpen();
      }}
    >
      <AboutEthosCardBody profile={profile} onOpen={onOpen} />
    </article>
  );
}
