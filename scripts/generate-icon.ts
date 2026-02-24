/**
 * Generate app icon as PNG using sharp + SVG.
 * Run: npx tsx scripts/generate-icon.ts
 *
 * Outputs build/icon.png (512x512)
 *
 * For Mac packaging, convert to .icns:
 *   - https://cloudconvert.com/png-to-icns
 *   - Or on Mac: mkdir icon.iconset && sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png && iconutil -c icns icon.iconset
 */

import sharp from 'sharp';
import { join } from 'path';

const SIZE = 512;

const svg = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="roundedBg">
      <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="64" ry="64"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" rx="64" ry="64" fill="#1a1a2e"/>

  <!-- Grid lines (subtle) -->
  <g opacity="0.08" stroke="#4a9eff" stroke-width="1" clip-path="url(#roundedBg)">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="${SIZE}"/>`).join('\n    ')}
    ${Array.from({ length: 13 }, (_, i) => `<line x1="0" y1="${i * 40}" x2="${SIZE}" y2="${i * 40}"/>`).join('\n    ')}
  </g>

  <!-- Border -->
  <rect x="12" y="12" width="${SIZE - 24}" height="${SIZE - 24}" rx="52" ry="52"
        fill="none" stroke="#4a9eff" stroke-width="6"/>

  <!-- Center dark circle -->
  <circle cx="${SIZE / 2}" cy="${SIZE / 2 - 10}" r="170" fill="#0e0e22"/>

  <!-- Turret outer glow -->
  <circle cx="${SIZE / 2}" cy="${SIZE / 2 + 10}" r="100" fill="rgba(74,158,255,0.15)"/>

  <!-- Turret base dark -->
  <circle cx="${SIZE / 2}" cy="${SIZE / 2 + 10}" r="80" fill="#1a3a6e"/>

  <!-- Turret base -->
  <circle cx="${SIZE / 2}" cy="${SIZE / 2 + 10}" r="70" fill="#4a9eff"/>

  <!-- Turret highlight -->
  <circle cx="${SIZE / 2 - 20}" cy="${SIZE / 2 - 10}" r="35" fill="rgba(123,188,255,0.5)"/>

  <!-- Turret center -->
  <circle cx="${SIZE / 2}" cy="${SIZE / 2 + 10}" r="22" fill="#aaddff"/>

  <!-- Core glow -->
  <circle cx="${SIZE / 2}" cy="${SIZE / 2 + 10}" r="10" fill="rgba(255,255,255,0.5)"/>

  <!-- Barrel outline -->
  <rect x="${SIZE / 2 - 14}" y="${SIZE / 2 - 90}" width="28" height="90" fill="#1a3a6e"/>

  <!-- Barrel body -->
  <rect x="${SIZE / 2 - 10}" y="${SIZE / 2 - 86}" width="20" height="82" fill="#7bbcff"/>

  <!-- Barrel highlight -->
  <rect x="${SIZE / 2 - 10}" y="${SIZE / 2 - 86}" width="5" height="82" fill="rgba(170,221,255,0.5)"/>

  <!-- Muzzle -->
  <rect x="${SIZE / 2 - 12}" y="${SIZE / 2 - 94}" width="24" height="10" fill="#ccddff"/>

  <!-- Muzzle flash -->
  <circle cx="${SIZE / 2}" cy="${SIZE / 2 - 100}" r="8" fill="rgba(255,255,170,0.6)"/>
  <circle cx="${SIZE / 2}" cy="${SIZE / 2 - 100}" r="4" fill="rgba(255,255,255,0.4)"/>

  <!-- Title -->
  <text x="${SIZE / 2}" y="${SIZE - 70}" text-anchor="middle"
        font-family="monospace" font-weight="bold" font-size="44" fill="#4a9eff">DESKTOP</text>
  <text x="${SIZE / 2}" y="${SIZE - 28}" text-anchor="middle"
        font-family="monospace" font-weight="bold" font-size="44" fill="#4a9eff">DEFENDER</text>
</svg>
`;

async function generate() {
  const outputPath = join(__dirname, '..', 'build', 'icon.png');

  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(outputPath);

  console.log(`Icon saved to ${outputPath} (512x512)`);

  // Also generate a 256x256 version
  const outputPath256 = join(__dirname, '..', 'build', 'icon-256.png');
  await sharp(Buffer.from(svg))
    .resize(256, 256)
    .png()
    .toFile(outputPath256);

  console.log(`Icon saved to ${outputPath256} (256x256)`);
}

generate().catch(console.error);
