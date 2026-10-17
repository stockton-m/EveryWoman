import { X } from "lucide-react";
import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import {
  InstagramIcon,
  SubstackIcon,
  TikTokIcon,
} from "@/app/components/posts/PlatformIcons";
import {
  getPlatformColor,
  getPlatformLabel,
  type PostSource,
} from "@/app/content/posts";
import { BROWN, SANS, SERIF } from "@/app/constants";

const platformFilters: { source: PostSource; Icon: typeof TikTokIcon }[] = [
  { source: "tiktok", Icon: TikTokIcon },
  { source: "instagram", Icon: InstagramIcon },
  { source: "substack", Icon: SubstackIcon },
];

type PostsFilterModalProps = {
  draft: PostSource | null;
  onClose: () => void;
  onSave: () => void;
  onToggle: (source: PostSource) => void;
  open: boolean;
};

function stopDialogClose(event: MouseEvent) {
  event.stopPropagation();
}

export function PostsFilterModal({
  draft,
  onClose,
  onSave,
  onToggle,
  open,
}: PostsFilterModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCloseRef.current();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="posts-filter-modal" onMouseDown={onClose}>
      <div
        className="posts-filter-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="posts-filter-title"
        onMouseDown={stopDialogClose}
      >
        <div className="posts-filter-modal__header">
          <h2
            id="posts-filter-title"
            className="posts-filter-modal__title"
            style={{ fontFamily: SERIF }}
          >
            Filter
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="posts-filter-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p
          className="posts-filter-modal__intro"
          style={{ color: BROWN, fontFamily: SANS }}
        >
          Filter posts to a single social media source.
        </p>
        <div className="posts-filter-modal__options">
          {platformFilters.map(({ source, Icon }) => {
            const selected = draft === source;
            const name = getPlatformLabel(source);
            return (
              <button
                key={source}
                type="button"
                className={`platform-filter${
                  source === "substack" ? " platform-filter--substack" : ""
                }${selected ? " platform-filter--selected" : ""}`}
                aria-pressed={selected}
                aria-label={
                  selected ? `Clear ${name} filter` : `Filter to ${name} posts`
                }
                onClick={() => onToggle(source)}
                style={
                  {
                    "--platform-color": getPlatformColor(source),
                  } as CSSProperties
                }
              >
                <Icon />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="pill-btn pill-btn--ember posts-filter-modal__save inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          style={{ fontFamily: SANS }}
          onClick={onSave}
        >
          Save
        </button>
      </div>
    </div>,
    document.body,
  );
}
