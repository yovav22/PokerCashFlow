const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  const svgPath = path.join(publicDir, 'favicon.svg');
  
  if (!fs.existsSync(svgPath)) {
    console.error('❌ favicon.svg not found');
    return;
  }

  console.log('🎨 Generating PWA icons...');

  // Generate regular icons
  for (const size of iconSizes) {
    const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
    
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
      
    console.log(`✅ Generated ${size}x${size} icon`);
  }

  // Generate maskable icons (with padding for safe area)
  for (const size of maskableSizes) {
    const outputPath = path.join(publicDir, `icon-${size}x${size}-maskable.png`);
    
    // Create canvas with padding (20% on each side for safe area)
    const canvasSize = size;
    const iconSize = Math.round(size * 0.6); // Icon takes 60% of canvas
    const padding = Math.round((canvasSize - iconSize) / 2);
    
    await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 239, g: 68, b: 68, alpha: 1 } // Theme color background
      }
    })
    .composite([
      {
        input: await sharp(svgPath).resize(iconSize, iconSize).png().toBuffer(),
        top: padding,
        left: padding
      }
    ])
    .png()
    .toFile(outputPath);
    
    console.log(`✅ Generated ${size}x${size} maskable icon`);
  }

  console.log('🎉 All PWA icons generated successfully!');
}

generateIcons().catch(console.error); 