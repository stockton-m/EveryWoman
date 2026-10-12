import { EMBER, SERIF } from "@/app/constants";

type PortraitPlaceholderProps = {
  size?: string;
  className?: string;
};

export function PortraitPlaceholder({
  size,
  className = "",
}: PortraitPlaceholderProps) {
  const dimension =
    size ?? "var(--portrait-size, clamp(6rem, 12vw, 9rem))";

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: dimension,
        height: dimension,
        background: EMBER,
        border: "3px solid rgba(245,237,228,0.35)",
      }}
      aria-hidden
    >
      <span
        className="font-bold select-none"
        style={{
          fontFamily: SERIF,
          color: "#f5ede4",
          fontSize: "var(--portrait-mark, clamp(2rem, 5vw, 3rem))",
          lineHeight: 1,
        }}
      >
        ?
      </span>
    </div>
  );
}
