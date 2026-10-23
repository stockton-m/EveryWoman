import { Fragment } from "react";
import { ExternalLink } from "@/app/components/ExternalLink";
import type { AboutInline } from "@/app/content/about";

type AboutInlinesProps = {
  content: AboutInline[];
};

export function AboutInlines({ content }: AboutInlinesProps) {
  return content.map((part, index) => {
    if (typeof part === "string") {
      return <Fragment key={index}>{part}</Fragment>;
    }
    if (part.kind === "em") {
      return <em key={index}>{part.text}</em>;
    }
    const lines = part.text.split("\n");
    return (
      <ExternalLink key={index} href={part.href} variant="inherit" wrap>
        {lines.length === 1
          ? part.text
          : lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {line}
              </Fragment>
            ))}
      </ExternalLink>
    );
  });
}

/** Card preview: later paragraphs continue in the same clamped block. */
export function flattenAboutParagraphs(paragraphs: AboutInline[][]): AboutInline[] {
  return paragraphs.flatMap((paragraph, index) =>
    index === 0 ? paragraph : [" ", ...paragraph],
  );
}
