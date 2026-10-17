import { CREAM } from "@/app/constants";

const MATCH_DISTANCE = 12;
const MATCH_RATIO = 0.9;
const SAMPLE_WIDTH = 48;
const MAX_DISTANCE_SQ = MATCH_DISTANCE * MATCH_DISTANCE;

const cream = hexRgb(CREAM);

export type CoverCrop = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

/** Source rect for `object-fit: cover` with `object-position: center`. */
export function coverCrop(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
): CoverCrop | null {
  if (
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    boxWidth <= 0 ||
    boxHeight <= 0
  ) {
    return null;
  }

  const scale = Math.max(boxWidth / imageWidth, boxHeight / imageHeight);
  const sw = Math.min(imageWidth, boxWidth / scale);
  const sh = Math.min(imageHeight, boxHeight / scale);
  return {
    sx: Math.max(0, (imageWidth - sw) / 2),
    sy: Math.max(0, (imageHeight - sh) / 2),
    sw,
    sh,
  };
}

/** True when the top, left, and right edges are mostly page cream. */
export function edgesMatchCream(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): boolean {
  if (width < 1 || height < 1) return false;

  let samples = 0;
  let matches = 0;
  const consider = (offset: number) => {
    const dr = data[offset] - cream.r;
    const dg = data[offset + 1] - cream.g;
    const db = data[offset + 2] - cream.b;
    samples += 1;
    if (dr * dr + dg * dg + db * db <= MAX_DISTANCE_SQ) matches += 1;
  };

  for (let x = 0; x < width; x += 1) consider(x * 4);

  const right = width - 1;
  for (let y = 1; y < height; y += 1) {
    consider(y * width * 4);
    if (right > 0) consider((y * width + right) * 4);
  }

  return matches / samples >= MATCH_RATIO;
}

/** Reads the visible cover-crop edges. Returns false if the pixels cannot be read. */
export function thumbnailEdgeBlends(
  image: HTMLImageElement,
  boxWidth: number,
  boxHeight: number,
): boolean {
  const crop = coverCrop(
    image.naturalWidth,
    image.naturalHeight,
    boxWidth,
    boxHeight,
  );
  if (!crop) return false;

  const sampleWidth = SAMPLE_WIDTH;
  const sampleHeight = Math.max(
    1,
    Math.round((sampleWidth * boxHeight) / boxWidth),
  );
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return false;

  try {
    context.drawImage(
      image,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      sampleWidth,
      sampleHeight,
    );
    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
    return edgesMatchCream(data, sampleWidth, sampleHeight);
  } catch {
    return false;
  }
}

function hexRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}
