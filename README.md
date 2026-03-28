# image-color-palette-extractor

A lightweight utility for extracting a color palette from image pixel data for theming and UI workflows.

This project helps turn raw RGBA pixel data into a compact palette of dominant colors. It is useful when you want to derive theme colors from an image, build simple design automation, or normalize image colors into a smaller set of representative swatches.

It is intentionally focused. It extracts palettes from pixel data and ImageData-like objects, rather than trying to be a full image decoding or graphics library.

## Why this project exists

Design and content systems often need a small set of colors that represent an image.

This might be used to:

- derive a theme from a hero image.
- generate accent colors for cards or previews.
- build lightweight content or branding tools.
- simplify image colors for downstream processing.

In many cases, teams do not need a heavy image pipeline. They need a reliable way to turn pixels into a practical palette.

## Mental model

This package follows a simple flow:

`Image pixels -> Quantization -> Clustering -> Palette -> Theme colors`

It does not decode image files by itself. Instead, it accepts RGBA pixel data directly, or an ImageData-like object, and returns structured swatches.

## What is included

- Palette extraction from RGBA pixel arrays.
- Support for ImageData-like objects.
- Hex and RGB helpers.
- Basic theme color picking from extracted palettes.
- Example usage.
- Tests.

## Install

```bash
npm install image-color-palette-extractor
```

## Example

```js
import {
  extractPaletteFromPixels,
  pickThemeColors
} from "image-color-palette-extractor";

const pixels = new Uint8ClampedArray([
  34, 40, 49, 255,
  34, 40, 49, 255,
  79, 70, 229, 255,
  16, 185, 129, 255,
  248, 250, 252, 255
]);

const palette = extractPaletteFromPixels(pixels, {
  colorCount: 4,
  bucketSize: 16
});

const theme = pickThemeColors(palette);

console.log(palette);
console.log(theme);
```

## API

### `extractPaletteFromPixels(pixels, options)`

Extracts a palette from RGBA pixel data.

Options include `colorCount`, `bucketSize`, `sampleStep`, `minAlpha`, and `maxIterations`.

Each returned swatch includes:

- `rgb`
- `hex`
- `population`
- `luminance`

### `extractPaletteFromImageData(imageData, options)`

A convenience wrapper for browser-style `ImageData` objects or similar structures with a `data` field.

### `pickThemeColors(palette)`

Returns a simple theme object with `primary`, `secondary`, `accent`, `background`, and `foreground` selections.

### `rgbToHex(color)` and `hexToRgb(hex)`

Small helpers for converting between color formats.

## Design Principles

This project is intentionally minimal.

It focuses on a narrow but useful task: extracting dominant colors from already-available image pixels. The design emphasizes clarity, portability, and low overhead.

The project favors:

- small inputs and predictable outputs.
- simple theme derivation over full design tooling.
- composability over framework complexity.

## Non-Goals

This project does not attempt to:

- decode PNG, JPEG, or other image formats directly.
- replace full image processing libraries.
- generate complete design systems or accessibility audits.

It is best used as a focused palette extraction utility inside a broader content, design, or UI workflow.

## Roadmap

Future extensions may include:

- optional palette sorting strategies.
- support for excluding near-neutral colors.
- contrast-aware theme helpers.
- adapters for common browser or canvas workflows.

## License

MIT
