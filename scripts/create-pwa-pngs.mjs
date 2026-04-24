/**
 * Генерирует валидные PNG для Web App Manifest (installability).
 * Запуск: `node ./scripts/create-pwa-pngs.mjs` или автоматически из `postinstall`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');

let crcTable;

function makeCrcTable() {
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }
}

function crc32(buf) {
  if (!crcTable) {
    makeCrcTable();
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, combined, crcBuf]);
}

function encodePng(width, height, raw) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const compressed = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function solidRgbaPng(width, height, r, g, b, a = 255) {
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const i = rowStart + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  return encodePng(width, height, raw);
}

function maskablePng(size, r, g, b, marginFrac = 0.18) {
  const rowSize = 1 + size * 4;
  const raw = Buffer.alloc(rowSize * size);
  const bg = { r: 0x12, g: 0x12, b: 0x12 };
  const x0 = Math.floor(size * marginFrac);
  const x1 = Math.ceil(size * (1 - marginFrac));
  const y0 = x0;
  const y1 = x1;
  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const i = rowStart + 1 + x * 4;
      const inside = x >= x0 && x < x1 && y >= y0 && y < y1;
      raw[i] = inside ? r : bg.r;
      raw[i + 1] = inside ? g : bg.g;
      raw[i + 2] = inside ? b : bg.b;
      raw[i + 3] = 255;
    }
  }
  return encodePng(size, size, raw);
}

fs.mkdirSync(outDir, { recursive: true });

const accent = { r: 0xd8, g: 0x00, b: 0x32 };

fs.writeFileSync(path.join(outDir, 'icon-192.png'), solidRgbaPng(192, 192, accent.r, accent.g, accent.b));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), solidRgbaPng(512, 512, accent.r, accent.g, accent.b));
fs.writeFileSync(
  path.join(outDir, 'icon-192-maskable.png'),
  maskablePng(192, accent.r, accent.g, accent.b, 0.18),
);
fs.writeFileSync(
  path.join(outDir, 'icon-512-maskable.png'),
  maskablePng(512, accent.r, accent.g, accent.b, 0.18),
);

console.log('PWA PNG icons generated in', outDir);
