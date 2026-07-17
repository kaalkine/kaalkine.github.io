import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('assets/brand/kaalkine-logo.svg');
const rootDir = path.resolve('.');

async function generateFavicons() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);

    // Create a 512x512 PNG
    await sharp(svgBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(rootDir, 'favicon-512x512.png'));

    // Create a 192x192 PNG
    await sharp(svgBuffer)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(rootDir, 'favicon-192x192.png'));

    // Create a 48x48 PNG (useful for standard small favicon)
    await sharp(svgBuffer)
      .resize(48, 48, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(rootDir, 'favicon.png'));

    // Also a quick .ico by just outputting a 48x48 image as .ico. Sharp doesn't directly support .ico format, but some browsers can read PNG-format data in an .ico extension. 
    // Wait, just using favicon.png in the link is enough.

    console.log('Favicons generated successfully.');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons();
