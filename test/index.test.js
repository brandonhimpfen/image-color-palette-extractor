import test from "node:test";
import assert from "node:assert/strict";

import {
  extractPaletteFromPixels,
  extractPaletteFromImageData,
  hexToRgb,
  pickThemeColors,
  rgbToHex
} from "../src/index.js";

test("rgbToHex and hexToRgb convert values correctly", () => {
  assert.equal(rgbToHex([255, 0, 128]), "#ff0080");
  assert.deepEqual(hexToRgb("#ff0080"), [255, 0, 128]);
});

test("extractPaletteFromPixels returns dominant swatches", () => {
  const pixels = new Uint8ClampedArray([
    255, 0, 0, 255,
    255, 0, 0, 255,
    255, 0, 0, 255,
    0, 0, 255, 255,
    0, 0, 255, 255,
    0, 255, 0, 255,
    0, 255, 0, 255,
    255, 255, 255, 255
  ]);

  const palette = extractPaletteFromPixels(pixels, {
    colorCount: 3,
    bucketSize: 32
  });

  assert.equal(palette.length, 3);
  assert.equal(palette[0].population >= palette[1].population, true);
  assert.equal(typeof palette[0].hex, "string");
});

test("extractPaletteFromImageData accepts ImageData-like objects", () => {
  const imageData = {
    data: new Uint8ClampedArray([
      10, 20, 30, 255,
      10, 20, 30, 255,
      200, 210, 220, 255,
      200, 210, 220, 255
    ])
  };

  const palette = extractPaletteFromImageData(imageData, { colorCount: 2, bucketSize: 16 });
  assert.equal(palette.length, 2);
});

test("pickThemeColors maps palette to a simple theme object", () => {
  const palette = [
    { hex: "#111111", population: 20, luminance: 17 },
    { hex: "#3366cc", population: 15, luminance: 96 },
    { hex: "#fafafa", population: 10, luminance: 250 }
  ];

  const theme = pickThemeColors(palette);

  assert.equal(theme.primary, "#111111");
  assert.equal(theme.secondary, "#3366cc");
  assert.equal(theme.accent, "#fafafa");
  assert.equal(theme.background, "#111111");
  assert.equal(theme.foreground, "#fafafa");
});
