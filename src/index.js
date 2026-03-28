function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRgb(color) {
  if (!Array.isArray(color) || color.length < 3) {
    throw new TypeError("Expected an RGB array with at least 3 numeric entries.");
  }

  const [r, g, b] = color;
  for (const channel of [r, g, b]) {
    if (!Number.isFinite(channel)) {
      throw new TypeError("RGB channels must be finite numbers.");
    }
  }

  return [
    clamp(Math.round(r), 0, 255),
    clamp(Math.round(g), 0, 255),
    clamp(Math.round(b), 0, 255)
  ];
}

export function rgbToHex(color) {
  const [r, g, b] = normalizeRgb(color);
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function hexToRgb(hex) {
  if (typeof hex !== "string") {
    throw new TypeError("Expected a hex color string.");
  }

  const value = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new TypeError("Expected a 6-digit hex color string.");
  }

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ];
}

function luminance([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function distance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function averageCluster(cluster) {
  const totals = cluster.reduce(
    (accumulator, color) => {
      accumulator[0] += color[0];
      accumulator[1] += color[1];
      accumulator[2] += color[2];
      return accumulator;
    },
    [0, 0, 0]
  );

  return totals.map((value) => Math.round(value / cluster.length));
}

function quantizeColor(color, bucketSize) {
  return color.map((channel) => {
    const bucket = Math.floor(channel / bucketSize);
    return clamp(bucket * bucketSize + Math.floor(bucketSize / 2), 0, 255);
  });
}

function seedCentroids(colors, colorCount) {
  const unique = [];
  const seen = new Set();

  for (const color of colors) {
    const key = color.join(",");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(color);
    }
    if (unique.length === colorCount) {
      break;
    }
  }

  while (unique.length < colorCount && colors.length > 0) {
    unique.push(colors[unique.length % colors.length]);
  }

  return unique;
}

function clusterColors(colors, colorCount, maxIterations) {
  let centroids = seedCentroids(colors, colorCount);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const clusters = Array.from({ length: colorCount }, () => []);

    for (const color of colors) {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let index = 0; index < centroids.length; index += 1) {
        const currentDistance = distance(color, centroids[index]);
        if (currentDistance < bestDistance) {
          bestDistance = currentDistance;
          bestIndex = index;
        }
      }

      clusters[bestIndex].push(color);
    }

    const nextCentroids = centroids.map((centroid, index) => {
      const cluster = clusters[index];
      return cluster.length > 0 ? averageCluster(cluster) : centroid;
    });

    const unchanged = nextCentroids.every((centroid, index) =>
      centroid.every((channel, channelIndex) => channel === centroids[index][channelIndex])
    );

    centroids = nextCentroids;

    if (unchanged) {
      return { centroids, clusters };
    }
  }

  const finalClusters = Array.from({ length: colorCount }, () => []);
  for (const color of colors) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < centroids.length; index += 1) {
      const currentDistance = distance(color, centroids[index]);
      if (currentDistance < bestDistance) {
        bestDistance = currentDistance;
        bestIndex = index;
      }
    }

    finalClusters[bestIndex].push(color);
  }

  return { centroids, clusters: finalClusters };
}

function buildSwatches(centroids, clusters) {
  return centroids
    .map((rgb, index) => {
      const population = clusters[index]?.length ?? 0;
      return {
        rgb: normalizeRgb(rgb),
        hex: rgbToHex(rgb),
        population,
        luminance: Math.round(luminance(rgb) * 1000) / 1000
      };
    })
    .filter((swatch) => swatch.population > 0)
    .sort((a, b) => b.population - a.population || a.luminance - b.luminance);
}

export function extractPaletteFromPixels(pixels, options = {}) {
  if (!Array.isArray(pixels) && !(pixels instanceof Uint8Array) && !(pixels instanceof Uint8ClampedArray)) {
    throw new TypeError("Expected pixels to be an array or typed array.");
  }

  const {
    colorCount = 5,
    bucketSize = 16,
    sampleStep = 1,
    minAlpha = 1,
    maxIterations = 8
  } = options;

  if (!Number.isInteger(colorCount) || colorCount < 1) {
    throw new TypeError("colorCount must be a positive integer.");
  }

  if (!Number.isInteger(bucketSize) || bucketSize < 1 || bucketSize > 256) {
    throw new TypeError("bucketSize must be an integer between 1 and 256.");
  }

  if (!Number.isInteger(sampleStep) || sampleStep < 1) {
    throw new TypeError("sampleStep must be a positive integer.");
  }

  if (pixels.length % 4 !== 0) {
    throw new TypeError("Expected RGBA pixel data whose length is divisible by 4.");
  }

  const sampledColors = [];

  for (let index = 0; index < pixels.length; index += 4 * sampleStep) {
    const alpha = pixels[index + 3];
    if (alpha < minAlpha) {
      continue;
    }

    const quantized = quantizeColor([
      pixels[index],
      pixels[index + 1],
      pixels[index + 2]
    ], bucketSize);

    sampledColors.push(quantized);
  }

  if (sampledColors.length === 0) {
    return [];
  }

  const { centroids, clusters } = clusterColors(
    sampledColors,
    Math.min(colorCount, sampledColors.length),
    maxIterations
  );

  return buildSwatches(centroids, clusters);
}

export function extractPaletteFromImageData(imageData, options = {}) {
  if (!imageData || !imageData.data) {
    throw new TypeError("Expected an ImageData-like object with a data property.");
  }

  return extractPaletteFromPixels(imageData.data, options);
}

export function pickThemeColors(palette) {
  if (!Array.isArray(palette) || palette.length === 0) {
    return {
      primary: null,
      secondary: null,
      accent: null,
      background: null,
      foreground: null
    };
  }

  const sortedByPopulation = [...palette].sort((a, b) => b.population - a.population);
  const sortedByLuminance = [...palette].sort((a, b) => a.luminance - b.luminance);

  return {
    primary: sortedByPopulation[0]?.hex ?? null,
    secondary: sortedByPopulation[1]?.hex ?? sortedByPopulation[0]?.hex ?? null,
    accent: sortedByPopulation[2]?.hex ?? sortedByPopulation[0]?.hex ?? null,
    background: sortedByLuminance[0]?.hex ?? null,
    foreground: sortedByLuminance[sortedByLuminance.length - 1]?.hex ?? null
  };
}
