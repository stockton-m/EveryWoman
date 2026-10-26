import assert from "node:assert/strict";
import { test } from "node:test";

import {
  INSTAGRAM_EMBED_GUTTER_PX,
  instagramEmbedGestureBands,
  instagramEmbedStage,
  shouldMountInstagramEmbed,
  withInstagramEmbedParams,
  type InstagramEmbedRect,
} from "../instagramEmbed.ts";

function contains(rect: InstagramEmbedRect, x: number, y: number): boolean {
  return (
    x >= rect.left &&
    x < rect.left + rect.width &&
    y >= rect.top &&
    y < rect.top + rect.height
  );
}

test("shouldMountInstagramEmbed only while a fallback slide is settled and active", () => {
  assert.equal(shouldMountInstagramEmbed(true, true, 0), true);
  assert.equal(shouldMountInstagramEmbed(false, true, 0), false);
  assert.equal(shouldMountInstagramEmbed(true, false, 0), false);
  assert.equal(shouldMountInstagramEmbed(true, true, 12), false);
  assert.equal(shouldMountInstagramEmbed(true, true, -480), false);
});

test("instagramEmbedStage letterboxes a 4:5 frame in a tall phone viewport", () => {
  assert.deepEqual(instagramEmbedStage(390, 844), {
    top: 178.25,
    left: 0,
    width: 390,
    height: 487.5,
  });
});

test("instagramEmbedStage shrinks the frame to fit a short viewport", () => {
  assert.deepEqual(instagramEmbedStage(800, 500), {
    top: 0,
    left: 200,
    width: 400,
    height: 500,
  });
});

test("gesture bands cover the letterbox and side gutters and leave the play control open", () => {
  const viewport = { width: 390, height: 844 };
  const stage = instagramEmbedStage(viewport.width, viewport.height);
  const bands = instagramEmbedGestureBands(viewport.width, viewport.height);
  const playX = stage.left + stage.width / 2;
  const playY = stage.top + stage.height / 2;

  assert.equal(
    bands.some((band) => contains(band, playX, playY)),
    false,
  );
  assert.equal(
    bands.some((band) => contains(band, playX, stage.top / 2)),
    true,
  );
  assert.equal(
    bands.some((band) => contains(band, INSTAGRAM_EMBED_GUTTER_PX / 2, playY)),
    true,
  );
  assert.equal(
    bands.some((band) =>
      contains(band, viewport.width - INSTAGRAM_EMBED_GUTTER_PX / 2, playY),
    ),
    true,
  );
});

test("gesture gutters never cross when the stage is narrower than the inset", () => {
  const bands = instagramEmbedGestureBands(30, 80, 24);
  const stage = instagramEmbedStage(30, 80);
  const overlap = bands.filter(
    (band) => band.top === stage.top && band.height === stage.height,
  );
  const covered = overlap.reduce((sum, band) => sum + band.width, 0);
  assert.equal(covered, stage.width + stage.left + (30 - (stage.left + stage.width)));
});

test("withInstagramEmbedParams adds the official embed query without dropping the path", () => {
  assert.equal(
    withInstagramEmbedParams("https://www.instagram.com/reel/abc/embed/"),
    "https://www.instagram.com/reel/abc/embed/?cr=1&v=14",
  );
  assert.equal(
    withInstagramEmbedParams("https://www.instagram.com/p/abc/embed?cr=0&v=1&utm=1"),
    "https://www.instagram.com/p/abc/embed?cr=1&v=14&utm=1",
  );
});
