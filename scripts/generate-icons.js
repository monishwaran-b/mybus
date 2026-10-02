import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer: width * height * 4
  const data = Buffer.alloc(width * height * 4);
  drawFn(width, height, (x, y, r, g, b, a) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  });

  // Filter scanlines: 0 filter type byte before each row
  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawScanlines[rowOffset] = 0; // Filter type 0 (None)
    data.copy(rawScanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawBusIcon(width, height, setPixel, isMaskable = false) {
  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 512;
  // If maskable, icon safe zone is 80% (inner padding)
  const padScale = isMaskable ? 0.75 : 0.88;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Background gradient: Deep dark slate to vibrant indigo/blue (#070b14 -> #0f172a -> #1e1b4b)
      const gradT = (x + y) / (width + height);
      let bgR = Math.round(7 + gradT * 20);
      let bgG = Math.round(11 + gradT * 25);
      let bgB = Math.round(20 + gradT * 55);

      // Add a subtle radial glow from center
      const dxCenter = x - cx;
      const dyCenter = y - cy;
      const distFromCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
      const glow = Math.max(0, 1 - distFromCenter / (width * 0.65));
      bgR = Math.min(255, bgR + Math.round(glow * 40));
      bgG = Math.min(255, bgG + Math.round(glow * 50));
      bgB = Math.min(255, bgB + Math.round(glow * 110));

      setPixel(x, y, bgR, bgG, bgB, 255);
    }
  }

  // Draw Rounded Badge container (if not maskable)
  const badgeRadius = width * 0.44 * padScale;
  // Draw Bus silhouette and futuristic transit elements
  // Bus Dimensions relative to center
  const busW = 210 * scale * padScale;
  const busH = 260 * scale * padScale;
  const busTop = cy - busH * 0.52;
  const busBottom = cy + busH * 0.48;
  const busLeft = cx - busW / 2;
  const busRight = cx + busW / 2;
  const cornerR = 28 * scale * padScale;

  for (let y = Math.floor(busTop - 20 * scale); y <= Math.ceil(busBottom + 40 * scale); y++) {
    for (let x = Math.floor(busLeft - 30 * scale); x <= Math.ceil(busRight + 30 * scale); x++) {
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      // Inside main bus body?
      const inMainBodyX = x >= busLeft && x <= busRight;
      const inMainBodyY = y >= busTop && y <= busBottom - 30 * scale * padScale;

      // Check rounded corners of bus roof
      let inBusBody = false;
      if (inMainBodyX && inMainBodyY) {
        let insideCorners = true;
        // Top left corner
        if (x < busLeft + cornerR && y < busTop + cornerR) {
          const d = Math.hypot(x - (busLeft + cornerR), y - (busTop + cornerR));
          if (d > cornerR) insideCorners = false;
        }
        // Top right corner
        if (x > busRight - cornerR && y < busTop + cornerR) {
          const d = Math.hypot(x - (busRight - cornerR), y - (busTop + cornerR));
          if (d > cornerR) insideCorners = false;
        }
        // Bottom left corner
        if (x < busLeft + cornerR && y > busBottom - 30 * scale * padScale - cornerR) {
          const d = Math.hypot(x - (busLeft + cornerR), y - (busBottom - 30 * scale * padScale - cornerR));
          if (d > cornerR) insideCorners = false;
        }
        // Bottom right corner
        if (x > busRight - cornerR && y > busBottom - 30 * scale * padScale - cornerR) {
          const d = Math.hypot(x - (busRight - cornerR), y - (busBottom - 30 * scale * padScale - cornerR));
          if (d > cornerR) insideCorners = false;
        }
        if (insideCorners) inBusBody = true;
      }

      // Windshield
      const winTop = busTop + 35 * scale * padScale;
      const winBottom = winTop + 85 * scale * padScale;
      const winLeft = busLeft + 22 * scale * padScale;
      const winRight = busRight - 22 * scale * padScale;
      const inWindshield = x >= winLeft && x <= winRight && y >= winTop && y <= winBottom;

      // Destination display banner above windshield
      const signTop = busTop + 14 * scale * padScale;
      const signBottom = signTop + 14 * scale * padScale;
      const signLeft = busLeft + 45 * scale * padScale;
      const signRight = busRight - 45 * scale * padScale;
      const inSign = x >= signLeft && x <= signRight && y >= signTop && y <= signBottom;

      // Headlights (two sleek rounded LEDs)
      const lightY = busBottom - 65 * scale * padScale;
      const leftLightX = busLeft + 35 * scale * padScale;
      const rightLightX = busRight - 35 * scale * padScale;
      const inLeftLight = Math.hypot(x - leftLightX, y - lightY) < 14 * scale * padScale;
      const inRightLight = Math.hypot(x - rightLightX, y - lightY) < 14 * scale * padScale;

      // Grille / Modern Cyan Line
      const grilleY = busBottom - 65 * scale * padScale;
      const inGrille = y >= grilleY - 2 * scale && y <= grilleY + 2 * scale && x >= busLeft + 70 * scale * padScale && x <= busRight - 70 * scale * padScale;

      // Wheels
      const wheelR = 24 * scale * padScale;
      const wheelY = busBottom - 20 * scale * padScale;
      const leftWheelX = busLeft + 35 * scale * padScale;
      const rightWheelX = busRight - 35 * scale * padScale;
      const inLeftWheel = Math.hypot(x - leftWheelX, y - wheelY) < wheelR;
      const inRightWheel = Math.hypot(x - rightWheelX, y - wheelY) < wheelR;
      const inWheelRim = Math.hypot(x - leftWheelX, y - wheelY) < wheelR * 0.45 || Math.hypot(x - rightWheelX, y - wheelY) < wheelR * 0.45;

      // Side mirrors
      const mirrorY = busTop + 60 * scale * padScale;
      const inLeftMirror = Math.hypot(x - (busLeft - 12 * scale * padScale), y - mirrorY) < 12 * scale * padScale;
      const inRightMirror = Math.hypot(x - (busRight + 12 * scale * padScale), y - mirrorY) < 12 * scale * padScale;

      if (inLeftWheel || inRightWheel) {
        if (inWheelRim) {
          setPixel(x, y, 140, 150, 175, 255); // Hubcap
        } else {
          setPixel(x, y, 18, 22, 35, 255); // Tire
        }
      } else if (inWindshield) {
        // Cyan glass reflection gradient
        const glassT = (y - winTop) / (winBottom - winTop);
        setPixel(x, y, Math.round(15 + glassT * 10), Math.round(160 + glassT * 80), Math.round(230 + glassT * 25), 255);
      } else if (inSign) {
        // Amber destination text banner
        setPixel(x, y, 255, 185, 35, 255);
      } else if (inLeftLight || inRightLight) {
        // Bright glowing white-cyan headlights
        setPixel(x, y, 220, 250, 255, 255);
      } else if (inGrille) {
        // Vibrant cyan accent stripe
        setPixel(x, y, 38, 217, 255, 255);
      } else if (inLeftMirror || inRightMirror) {
        setPixel(x, y, 112, 103, 255, 255); // Indigo mirrors
      } else if (inBusBody) {
        // Modern tech gradient: Indigo to royal blue (#7067ff to #4338ca)
        const bodyT = (y - busTop) / (busBottom - busTop);
        const r = Math.round(112 - bodyT * 45);
        const g = Math.round(103 - bodyT * 40);
        const b = Math.round(255 - bodyT * 50);
        setPixel(x, y, r, g, b, 255);
      }
    }
  }

  // Draw WiFi / Radar wave pulses above the bus (representing smart GPS tracking)
  const radarCenterY = busTop - 25 * scale * padScale;
  for (let r = 1; r <= 3; r++) {
    const waveRadius = (r * 18) * scale * padScale;
    for (let angleDeg = -65; angleDeg <= 65; angleDeg += 0.5) {
      const rad = (angleDeg - 90) * (Math.PI / 180);
      const px = Math.round(cx + Math.cos(rad) * waveRadius);
      const py = Math.round(radarCenterY + Math.sin(rad) * waveRadius);
      const alpha = Math.round(255 * (1 - (r - 1) * 0.28));
      // 2px stroke
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          setPixel(px + ox, py + oy, 38, 217, 255, alpha);
        }
      }
    }
  }
}

// Ensure public directory exists
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');

// 1. 192x192
const icon192 = createPNG(192, 192, (w, h, p) => drawBusIcon(w, h, p, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
console.log('Created pwa-192x192.png');

// 2. 512x512
const icon512 = createPNG(512, 512, (w, h, p) => drawBusIcon(w, h, p, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
console.log('Created pwa-512x512.png');

// 3. 512x512 Maskable
const iconMaskable = createPNG(512, 512, (w, h, p) => drawBusIcon(w, h, p, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);
console.log('Created pwa-maskable-512x512.png');

// 4. Apple Touch Icon 180x180
const iconApple = createPNG(180, 180, (w, h, p) => drawBusIcon(w, h, p, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), iconApple);
console.log('Created apple-touch-icon.png');

// 5. Favicon ICO / 64x64
const iconFav = createPNG(64, 64, (w, h, p) => drawBusIcon(w, h, p, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), iconFav);
console.log('Created favicon.ico');

console.log('All PWA icon assets generated successfully!');
