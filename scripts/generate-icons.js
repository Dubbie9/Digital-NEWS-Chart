// Generate PWA icons as simple PNG files using raw bitmap data
// This creates minimal valid PNG files without requiring any npm dependencies

import { writeFileSync } from 'fs';

// Simple PNG encoder (uncompressed, RGBA)
function createPNG(width, height, drawFn) {
  const pixels = new Uint8Array(width * height * 4);
  drawFn(pixels, width, height);

  // PNG signature
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];

  // IHDR chunk
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT: raw pixel data with filter byte per row
  const rawData = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // no filter
    for (let x = 0; x < width * 4; x++) {
      rawData[y * (1 + width * 4) + 1 + x] = pixels[y * width * 4 + x];
    }
  }

  // Deflate (store mode - no compression)
  const deflated = deflateStore(rawData);

  // Build chunks
  const chunks = [];
  chunks.push(makeChunk('IHDR', ihdr));
  chunks.push(makeChunk('IDAT', deflated));
  chunks.push(makeChunk('IEND', new Uint8Array(0)));

  // Combine
  const totalLen = 8 + chunks.reduce((s, c) => s + c.length, 0);
  const png = new Uint8Array(totalLen);
  let offset = 0;
  for (const b of signature) png[offset++] = b;
  for (const chunk of chunks) {
    png.set(chunk, offset);
    offset += chunk.length;
  }

  return Buffer.from(png);
}

function deflateStore(data) {
  // zlib header (CM=8, CINFO=7, FCHECK) + stored blocks + adler32
  const maxBlock = 65535;
  const numBlocks = Math.ceil(data.length / maxBlock);
  const out = [];

  // zlib header
  out.push(0x78, 0x01);

  for (let i = 0; i < numBlocks; i++) {
    const start = i * maxBlock;
    const end = Math.min(start + maxBlock, data.length);
    const len = end - start;
    const isLast = i === numBlocks - 1;

    out.push(isLast ? 1 : 0);
    out.push(len & 0xff, (len >> 8) & 0xff);
    out.push((~len) & 0xff, ((~len) >> 8) & 0xff);

    for (let j = start; j < end; j++) {
      out.push(data[j]);
    }
  }

  // Adler-32
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  const adler = (b << 16) | a;
  out.push((adler >> 24) & 0xff, (adler >> 16) & 0xff, (adler >> 8) & 0xff, adler & 0xff);

  return new Uint8Array(out);
}

function makeChunk(type, data) {
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);

  const crc = crc32(chunk.subarray(4, 8 + data.length));
  view.setUint32(8 + data.length, crc);

  return chunk;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─── Drawing Functions ─────────────────────────────────────────────

function setPixel(pixels, width, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0) return;
  const idx = (y * width + x) * 4;
  if (idx >= pixels.length) return;
  // Alpha blend
  const srcA = a / 255;
  const dstA = pixels[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA > 0) {
    pixels[idx] = (r * srcA + pixels[idx] * dstA * (1 - srcA)) / outA;
    pixels[idx + 1] = (g * srcA + pixels[idx + 1] * dstA * (1 - srcA)) / outA;
    pixels[idx + 2] = (b * srcA + pixels[idx + 2] * dstA * (1 - srcA)) / outA;
    pixels[idx + 3] = outA * 255;
  }
}

function fillRect(pixels, width, x, y, w, h, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(pixels, width, x + dx, y + dy, r, g, b, a);
    }
  }
}

function fillCircle(pixels, width, cx, cy, radius, r, g, b, a = 255) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(pixels, width, cx + dx, cy + dy, r, g, b, a);
      }
    }
  }
}

function fillRoundedRect(pixels, width, x, y, w, h, radius, r, g, b, a = 255) {
  fillRect(pixels, width, x + radius, y, w - 2 * radius, h, r, g, b, a);
  fillRect(pixels, width, x, y + radius, radius, h - 2 * radius, r, g, b, a);
  fillRect(pixels, width, x + w - radius, y + radius, radius, h - 2 * radius, r, g, b, a);
  fillCircle(pixels, width, x + radius, y + radius, radius, r, g, b, a);
  fillCircle(pixels, width, x + w - radius - 1, y + radius, radius, r, g, b, a);
  fillCircle(pixels, width, x + radius, y + h - radius - 1, radius, r, g, b, a);
  fillCircle(pixels, width, x + w - radius - 1, y + h - radius - 1, radius, r, g, b, a);
}

function drawIcon(pixels, width, height, maskable = false) {
  // Background: dark navy #0B1E36
  const bgR = 11, bgG = 30, bgB = 54;
  fillRect(pixels, width, 0, 0, width, height, bgR, bgG, bgB, 255);

  const scale = width / 512;
  const cx = width / 2;
  const cy = height / 2;

  // Safe zone for maskable: 80% of icon
  const safeOffset = maskable ? width * 0.1 : 0;
  const safeSize = width - safeOffset * 2;

  // Clipboard body
  const clipW = Math.round(safeSize * 0.45);
  const clipH = Math.round(safeSize * 0.55);
  const clipX = Math.round(cx - clipW / 2);
  const clipY = Math.round(cy - clipH / 2 + safeSize * 0.05);
  const clipR = Math.round(12 * scale);

  // White clipboard
  fillRoundedRect(pixels, width, clipX, clipY, clipW, clipH, clipR, 255, 255, 255, 255);

  // Clipboard tab at top
  const tabW = Math.round(clipW * 0.4);
  const tabH = Math.round(safeSize * 0.06);
  const tabX = Math.round(cx - tabW / 2);
  const tabY = Math.round(clipY - tabH / 2);
  const tabR = Math.round(4 * scale);
  fillRoundedRect(pixels, width, tabX, tabY, tabW, tabH, tabR, 0, 174, 239, 255); // #00AEEF

  // Checkmark in cyan
  const checkCx = Math.round(cx);
  const checkCy = Math.round(cy + safeSize * 0.06);
  const checkSize = Math.round(safeSize * 0.12);
  const lineW = Math.max(3, Math.round(4 * scale));

  // Draw check mark (simplified thick lines)
  for (let t = 0; t <= 1; t += 0.01) {
    // First stroke: going down-right
    const x1 = Math.round(checkCx - checkSize + t * checkSize * 0.5);
    const y1 = Math.round(checkCy + t * checkSize * 0.5);
    fillCircle(pixels, width, x1, y1, lineW, 0, 174, 239, 255);
  }
  for (let t = 0; t <= 1; t += 0.01) {
    // Second stroke: going up-right
    const x2 = Math.round(checkCx - checkSize * 0.5 + t * checkSize);
    const y2 = Math.round(checkCy + checkSize * 0.5 - t * checkSize);
    fillCircle(pixels, width, x2, y2, lineW, 0, 174, 239, 255);
  }
}

// ─── Generate Icons ────────────────────────────────────────────────

const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const { name, size, maskable } of sizes) {
  const png = createPNG(size, size, (px, w, h) => drawIcon(px, w, h, maskable));
  writeFileSync(`public/icons/${name}`, png);
  console.log(`Generated ${name} (${size}x${size})`);
}
