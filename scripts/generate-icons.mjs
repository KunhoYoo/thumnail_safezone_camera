/**
 * PWA 아이콘 생성 스크립트 (의존성 없음).
 * 아이콘 디자인을 바꾸려면 drawIcon() 안의 값만 수정하고 `npm run icons` 를 실행한다.
 *
 * 생성물:
 *   public/icons/icon-192.png
 *   public/icons/icon-512.png
 *   public/icons/icon-maskable-512.png
 *   public/icons/apple-touch-icon.png
 *   public/favicon.ico
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SUPERSAMPLE = 3;

const COLORS = {
  background: [11, 11, 12],
  frame: [255, 255, 255],
  block: [255, 69, 58],
  safe: [48, 209, 88],
};

function createSurface(size) {
  return { size, data: new Float64Array(size * size * 4) };
}

function blend(surface, x, y, [r, g, b], alpha) {
  if (alpha <= 0) return;
  const index = (y * surface.size + x) * 4;
  const data = surface.data;
  const dstA = data[index + 3];
  const outA = alpha + dstA * (1 - alpha);
  if (outA <= 0) return;
  data[index] = (r * alpha + data[index] * dstA * (1 - alpha)) / outA;
  data[index + 1] = (g * alpha + data[index + 1] * dstA * (1 - alpha)) / outA;
  data[index + 2] = (b * alpha + data[index + 2] * dstA * (1 - alpha)) / outA;
  data[index + 3] = outA;
}

function insideRoundRect(px, py, x, y, w, h, r) {
  if (px < x || py < y || px > x + w || py > y + h) return false;
  const radius = Math.min(r, w / 2, h / 2);
  if (radius <= 0) return true;
  const cx = Math.min(Math.max(px, x + radius), x + w - radius);
  const cy = Math.min(Math.max(py, y + radius), y + h - radius);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function fillRoundRect(surface, rect, color, alpha = 1) {
  const { x, y, w, h, r = 0 } = rect;
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(surface.size - 1, Math.ceil(x + w));
  const y1 = Math.min(surface.size - 1, Math.ceil(y + h));
  for (let py = y0; py <= y1; py += 1) {
    for (let px = x0; px <= x1; px += 1) {
      if (insideRoundRect(px + 0.5, py + 0.5, x, y, w, h, r)) blend(surface, px, py, color, alpha);
    }
  }
}

function strokeRoundRect(surface, rect, color, thickness, alpha = 1) {
  const { x, y, w, h, r = 0 } = rect;
  const x0 = Math.max(0, Math.floor(x - thickness));
  const y0 = Math.max(0, Math.floor(y - thickness));
  const x1 = Math.min(surface.size - 1, Math.ceil(x + w + thickness));
  const y1 = Math.min(surface.size - 1, Math.ceil(y + h + thickness));
  const inner = {
    x: x + thickness,
    y: y + thickness,
    w: w - thickness * 2,
    h: h - thickness * 2,
    r: Math.max(0, r - thickness),
  };
  for (let py = y0; py <= y1; py += 1) {
    for (let px = x0; px <= x1; px += 1) {
      const cx = px + 0.5;
      const cy = py + 0.5;
      if (!insideRoundRect(cx, cy, x, y, w, h, r)) continue;
      if (insideRoundRect(cx, cy, inner.x, inner.y, inner.w, inner.h, inner.r)) continue;
      blend(surface, px, py, color, alpha);
    }
  }
}

/** 검정 배경 + 9:16 흰 프레임 + 플랫폼 UI 가림 영역(빨강) */
function drawIcon(size, { maskable = false, squareBackground = false } = {}) {
  const S = size * SUPERSAMPLE;
  const surface = createSurface(S);

  fillRoundRect(
    surface,
    { x: 0, y: 0, w: S, h: S, r: maskable || squareBackground ? 0 : S * 0.22 },
    COLORS.background,
    1,
  );

  const inset = maskable ? S * 0.22 : S * 0.15;
  const boxW = S - inset * 2;
  const boxH = S - inset * 2;
  let frameH = boxH;
  let frameW = (frameH * 9) / 16;
  if (frameW > boxW) {
    frameW = boxW;
    frameH = (frameW * 16) / 9;
  }
  const frameX = (S - frameW) / 2;
  const frameY = (S - frameH) / 2;
  const radius = frameW * 0.1;
  const stroke = Math.max(1, S * 0.026);

  // 가림 영역
  fillRoundRect(surface, { x: frameX, y: frameY, w: frameW, h: frameH * 0.12, r: radius * 0.6 }, COLORS.block, 0.9);
  fillRoundRect(
    surface,
    { x: frameX, y: frameY + frameH * 0.8, w: frameW, h: frameH * 0.2, r: radius * 0.6 },
    COLORS.block,
    0.9,
  );
  fillRoundRect(
    surface,
    { x: frameX + frameW * 0.74, y: frameY + frameH * 0.38, w: frameW * 0.26, h: frameH * 0.34, r: radius * 0.5 },
    COLORS.block,
    0.9,
  );

  // 권장 영역
  strokeRoundRect(
    surface,
    {
      x: frameX + frameW * 0.16,
      y: frameY + frameH * 0.24,
      w: frameW * 0.5,
      h: frameH * 0.42,
      r: radius * 0.4,
    },
    COLORS.safe,
    Math.max(1, stroke * 0.55),
    0.95,
  );

  // 프레임
  strokeRoundRect(surface, { x: frameX, y: frameY, w: frameW, h: frameH, r: radius }, COLORS.frame, stroke, 1);

  return downsample(surface, size);
}

function downsample(surface, size) {
  const out = Buffer.alloc(size * size * 4);
  const factor = SUPERSAMPLE;
  const samples = factor * factor;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < factor; sy += 1) {
        for (let sx = 0; sx < factor; sx += 1) {
          const index = ((y * factor + sy) * surface.size + (x * factor + sx)) * 4;
          const alpha = surface.data[index + 3];
          r += surface.data[index] * alpha;
          g += surface.data[index + 1] * alpha;
          b += surface.data[index + 2] * alpha;
          a += alpha;
        }
      }
      const outIndex = (y * size + x) * 4;
      if (a <= 0) {
        out[outIndex] = 0;
        out[outIndex + 1] = 0;
        out[outIndex + 2] = 0;
        out[outIndex + 3] = 0;
        continue;
      }
      out[outIndex] = Math.round(r / a);
      out[outIndex + 1] = Math.round(g / a);
      out[outIndex + 2] = Math.round(b / a);
      out[outIndex + 3] = Math.round((a / samples) * 255);
    }
  }
  return out;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(size, rgba) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function encodeIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngBuffer]);
}

function write(relativePath, buffer) {
  const target = join(ROOT, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, buffer);
  console.log("generated", relativePath, buffer.length + " bytes");
}

write("public/icons/icon-192.png", encodePng(192, drawIcon(192)));
write("public/icons/icon-512.png", encodePng(512, drawIcon(512)));
write("public/icons/icon-maskable-512.png", encodePng(512, drawIcon(512, { maskable: true })));
write("public/icons/apple-touch-icon.png", encodePng(180, drawIcon(180, { squareBackground: true })));
write("public/favicon.ico", encodeIco(encodePng(32, drawIcon(32)), 32));
