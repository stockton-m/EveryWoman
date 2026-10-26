/** Height of the profile header above `.EmbedVideo` in Instagram's embed document. */
export const INSTAGRAM_EMBED_HEADER_PX = 54;

/** Instagram's embed video stage is 4:5, so its height is 1.25 times its width. */
export const INSTAGRAM_EMBED_STAGE_RATIO = 5 / 4;

/** Side inset that keeps vertical swipes off Instagram's centered play control. */
export const INSTAGRAM_EMBED_GUTTER_PX = 24;

export type InstagramEmbedRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function shouldMountInstagramEmbed(
  isFallback: boolean,
  isActive: boolean,
  offset: number,
): boolean {
  return isFallback && isActive && offset === 0;
}

export function instagramEmbedStage(
  viewportWidth: number,
  viewportHeight: number,
): InstagramEmbedRect {
  const height = Math.min(viewportWidth * INSTAGRAM_EMBED_STAGE_RATIO, viewportHeight);
  const width = height / INSTAGRAM_EMBED_STAGE_RATIO;
  return {
    top: (viewportHeight - height) / 2,
    left: (viewportWidth - width) / 2,
    width,
    height,
  };
}

export function instagramEmbedGestureBands(
  viewportWidth: number,
  viewportHeight: number,
  gutter = INSTAGRAM_EMBED_GUTTER_PX,
): InstagramEmbedRect[] {
  const stage = instagramEmbedStage(viewportWidth, viewportHeight);
  const bands: InstagramEmbedRect[] = [];
  const push = (rect: InstagramEmbedRect) => {
    if (rect.width <= 0 || rect.height <= 0) return;
    bands.push(rect);
  };

  push({ top: 0, left: 0, width: viewportWidth, height: stage.top });
  push({
    top: stage.top + stage.height,
    left: 0,
    width: viewportWidth,
    height: viewportHeight - (stage.top + stage.height),
  });

  const side = Math.min(gutter, stage.width / 2);
  push({
    top: stage.top,
    left: 0,
    width: stage.left + side,
    height: stage.height,
  });
  const right = stage.left + stage.width - side;
  push({
    top: stage.top,
    left: right,
    width: viewportWidth - right,
    height: stage.height,
  });

  return bands;
}

export function withInstagramEmbedParams(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("cr", "1");
  parsed.searchParams.set("v", "14");
  return parsed.toString();
}
