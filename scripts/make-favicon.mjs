import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve('c:/Users/User/Downloads/ChatGPT Image Apr 7, 2026, 10_52_15 PM.png');
const outDir = path.resolve(__dirname, '..', 'app');
const publicDir = path.resolve(__dirname, '..', 'public');

async function run() {
  const trimmed = sharp(src).trim();

  // Favicon (32x32) - use the O as icon
  await trimmed.clone().resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(path.join(outDir, 'favicon.ico'));

  // Apple touch icon (180x180)
  await trimmed.clone().resize(180, 90, { fit: 'contain', background: { r: 6, g: 8, b: 9, alpha: 1 } })
    .extend({ top: 45, bottom: 45, background: { r: 6, g: 8, b: 9, alpha: 1 } })
    .resize(180, 180, { fit: 'cover' })
    .png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Nav wordmark logo (wide, for header)
  await trimmed.clone().resize({ height: 40, fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(path.join(publicDir, 'coil-logo.png'));

  // OG image (512x512)
  await trimmed.clone().resize(460, 200, { fit: 'contain', background: { r: 6, g: 8, b: 9, alpha: 1 } })
    .extend({ top: 156, bottom: 156, background: { r: 6, g: 8, b: 9, alpha: 1 } })
    .resize(512, 512, { fit: 'cover' })
    .png().toFile(path.join(publicDir, 'icon-512.png'));

  console.log('Done');
}

run().catch(console.error);
