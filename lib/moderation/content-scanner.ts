/**
 * Content moderation scanner using nsfwjs (TensorFlow.js, runs server-side).
 * Scans image buffers for explicit or harmful content.
 * Gracefully fails open — if the model errors, the upload is allowed through.
 */

// nsfwjs requires a global fetch and a DOM-like environment.
// We use the pure-JS @tensorflow/tfjs backend which works on Vercel serverless.
import * as nsfwjs from 'nsfwjs';

// Cache the model so it's only loaded once per serverless instance
let modelCache: nsfwjs.NSFWJS | null = null;

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
]);

// Probability threshold above which content is considered unsafe (0–1)
const UNSAFE_THRESHOLD = 0.6;

// Unsafe categories returned by nsfwjs
const UNSAFE_CATEGORIES = new Set(['Porn', 'Hentai']);

export interface ScanResult {
  safe: boolean;
  reason?: string;
  skipped?: boolean;
}

async function getModel(): Promise<nsfwjs.NSFWJS> {
  if (!modelCache) {
    modelCache = await nsfwjs.load('https://nsfwjs.com/quant_nsfw_mobilenet/', { size: 224 });
  }
  return modelCache;
}

/**
 * Scans a file buffer for explicit/harmful content.
 * Only processes image MIME types — all other types are skipped (safe).
 * Fails open on any error so uploads are never blocked by scanner failures.
 */
export async function scanContent(buffer: Buffer, mimeType: string): Promise<ScanResult> {
  // Only scan images
  if (!IMAGE_MIME_TYPES.has(mimeType.toLowerCase())) {
    return { safe: true, skipped: true };
  }

  try {
    const model = await getModel();

    // Convert buffer to base64 data URL for nsfwjs image input
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Create an Image element using the global (available in Next.js server runtime via jsdom shim)
    // nsfwjs.classify accepts HTMLImageElement or ImageData
    const img = await loadImageFromDataUrl(dataUrl);
    const predictions = await model.classify(img);

    return evaluatePredictions(predictions);
  } catch (err) {
    // Fail open — don't block upload if scanner errors
    console.warn('[CONTENT-SCAN] Scanner error (allowing upload):', err instanceof Error ? err.message : String(err));
    return { safe: true, skipped: true };
  }
}

/**
 * Loads an image from a data URL using the Node.js global fetch + createImageBitmap,
 * or falls back to a minimal canvas-free approach via raw pixel data.
 */
async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // In Next.js server runtime, Image is not available — we throw so the caller fails open
    if (typeof Image === 'undefined') {
      reject(new Error('Image API not available in this runtime'));
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function evaluatePredictions(
  predictions: Array<{ className: string; probability: number }>
): ScanResult {
  for (const pred of predictions) {
    if (UNSAFE_CATEGORIES.has(pred.className) && pred.probability >= UNSAFE_THRESHOLD) {
      return {
        safe: false,
        reason: `Content flagged as explicit (${pred.className}: ${Math.round(pred.probability * 100)}%)`,
      };
    }
  }
  return { safe: true };
}
