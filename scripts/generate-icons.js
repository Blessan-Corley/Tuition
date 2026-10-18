const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG template for the mathematical tuition icon
// Deep Slate (#0F172A) background with crisp white mathematical Summation symbol (∑) and "A" monogram
const mainSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Deep Slate Background -->
  <rect width="1024" height="1024" rx="220" fill="#0F172A"/>

  <!-- Subtle geometric grid lines -->
  <circle cx="512" cy="512" r="340" fill="none" stroke="#1E293B" stroke-width="12"/>
  <line x1="200" y1="512" x2="824" y2="512" stroke="#1E293B" stroke-width="6" stroke-dasharray="16,16"/>
  <line x1="512" y1="200" x2="512" y2="824" stroke="#1E293B" stroke-width="6" stroke-dasharray="16,16"/>

  <!-- Mathematical Summation (∑) Icon -->
  <path d="M 680 300 L 340 300 L 512 512 L 340 724 L 680 724" 
        fill="none" 
        stroke="#FFFFFF" 
        stroke-width="64" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>

  <!-- Subtle 'A' Accent Bar across center representing Allwyn -->
  <circle cx="680" cy="300" r="28" fill="#38BDF8"/>
  <circle cx="680" cy="724" r="28" fill="#38BDF8"/>
</svg>
`;

// Adaptive icon foreground (transparent background)
const fgSvg = `
<svg width="432" height="432" viewBox="0 0 432 432" xmlns="http://www.w3.org/2000/svg">
  <path d="M 280 120 L 140 120 L 216 216 L 140 312 L 280 312" 
        fill="none" 
        stroke="#FFFFFF" 
        stroke-width="26" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>
  <circle cx="280" cy="120" r="12" fill="#38BDF8"/>
  <circle cx="280" cy="312" r="12" fill="#38BDF8"/>
</svg>
`;

// Adaptive icon background
const bgSvg = `
<svg width="432" height="432" viewBox="0 0 432 432" xmlns="http://www.w3.org/2000/svg">
  <rect width="432" height="432" fill="#0F172A"/>
</svg>
`;

async function generate() {
  const assetsDir = path.join(__dirname, '..', 'assets');

  // 1. App Icon (1024x1024)
  await sharp(Buffer.from(mainSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('Generated icon.png (1024x1024)');

  // 2. Android Foreground (432x432)
  await sharp(Buffer.from(fgSvg))
    .resize(432, 432)
    .png()
    .toFile(path.join(assetsDir, 'android-icon-foreground.png'));
  console.log('Generated android-icon-foreground.png (432x432)');

  // 3. Android Background (432x432)
  await sharp(Buffer.from(bgSvg))
    .resize(432, 432)
    .png()
    .toFile(path.join(assetsDir, 'android-icon-background.png'));
  console.log('Generated android-icon-background.png (432x432)');

  // 4. Splash Icon (256x256)
  await sharp(Buffer.from(mainSvg))
    .resize(256, 256)
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('Generated splash-icon.png (256x256)');

  // 5. Favicon (48x48)
  await sharp(Buffer.from(mainSvg))
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('Generated favicon.png (48x48)');
}

generate().catch(console.error);
