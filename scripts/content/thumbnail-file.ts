import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const MAX_THUMBNAIL_BYTES = 8_000_000;

export function imageExtension(
  bytes: Uint8Array,
): "jpg" | "png" | "webp" | undefined {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return undefined;
}

export async function writeThumbnail(
  directory: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<void> {
  await mkdir(directory, { recursive: true });
  const filePath = join(directory, fileName);
  const temporaryPath = join(
    directory,
    `.${fileName}.${process.pid}.${randomUUID()}.tmp`,
  );

  try {
    await writeFile(temporaryPath, bytes, { flag: "wx" });
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function readThumbnailImage(
  fetchImpl: typeof fetch,
  url: string,
  postId: string,
  sourceLabel: string,
): Promise<Uint8Array> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: {
        accept: "image/*,application/json",
        "user-agent": "EveryWoman content synchronizer",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new Error(`${sourceLabel} thumbnail request failed for ${postId}.`, {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new Error(
      `${sourceLabel} thumbnail request failed for ${postId} with HTTP ${response.status}.`,
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_THUMBNAIL_BYTES) {
    throw new Error(
      `${sourceLabel} thumbnail for ${postId} was too large to archive.`,
    );
  }
  return bytes;
}
