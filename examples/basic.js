import {
  extractPaletteFromPixels,
  pickThemeColors
} from "../src/index.js";

const pixels = new Uint8ClampedArray([
  34, 40, 49, 255,
  34, 40, 49, 255,
  34, 40, 49, 255,
  79, 70, 229, 255,
  79, 70, 229, 255,
  16, 185, 129, 255,
  16, 185, 129, 255,
  248, 250, 252, 255
]);

const palette = extractPaletteFromPixels(pixels, {
  colorCount: 4,
  bucketSize: 16
});

const theme = pickThemeColors(palette);

console.log("Palette:", palette);
console.log("Theme:", theme);
