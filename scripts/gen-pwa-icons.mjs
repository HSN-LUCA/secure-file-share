import sharp from 'sharp';
import { writeFileSync } from 'fs';

async function generateIcon(size, filename, maskable = false) {
  const padding = maskable ? Math.round(size * 0.1) : Math.round(size * 0.05);
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = innerSize / 2;
  const fontSize = Math.round(size * 0.35);
  const bgColor = maskable ? '#D4A017' : 'transparent';

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${bgColor}" rx="${maskable ? 0 : Math.round(size * 0.2)}"/>
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F5C842"/>
        <stop offset="100%" stop-color="#D4A017"/>
      </linearGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#g)"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
      font-family="Georgia, serif" font-size="${fontSize}" font-weight="bold" fill="white">H</text>
  </svg>`;

  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(`public/${filename}`, buf);
  console.log(`Generated ${filename} (${buf.length} bytes)`);
}

await generateIcon(192, 'icon-192.png');
await generateIcon(512, 'icon-512.png');
await generateIcon(192, 'icon-maskable-192.png', true);
await generateIcon(512, 'icon-maskable-512.png', true);
console.log('Done!');
