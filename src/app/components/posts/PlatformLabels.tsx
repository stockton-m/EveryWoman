import {
  getPlatformColor,
  getPlatformLabel,
  type PostSource,
} from "@/app/content/posts";
import { BROWN, SANS } from "@/app/constants";

type PlatformLabelsProps = {
  sources: PostSource[];
  size?: "default" | "compact";
};

export function PlatformLabels({
  sources,
  size = "default",
}: PlatformLabelsProps) {
  return (
    <span
      className={`font-semibold uppercase tracking-[0.18em] ${
        size === "compact"
          ? "block text-[8px] leading-[1.15]"
          : "text-[10px]"
      }`}
      style={{ fontFamily: SANS }}
    >
      {sources.map((source, index) => (
        <span key={`${source}-${index}`}>
          {index > 0 ? <span style={{ color: BROWN }}> | </span> : null}
          <span style={{ color: getPlatformColor(source) }}>
            {getPlatformLabel(source)}
          </span>
        </span>
      ))}
    </span>
  );
}
