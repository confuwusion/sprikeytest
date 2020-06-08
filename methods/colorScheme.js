const { createCanvas, loadImage } = require("canvas");
const ColorScheme = require("color-scheme");
const parseColor = require("parse-color");

const MAX_HEX_DENARY = 16777215;
const COLOR_XY = 16;
const PALETTE_Y = 100;

const schemes = [
  "mono",
  "contrast",
  "triade",
  "tetrade",
  "analogic"
];
const variations = [
  "default",
  "pastel",
  "soft",
  "light",
  "hard",
  "pale"
];

async function generatePixels(urlOrImage) {
  const image = typeof urlOrImage === "string"
    ? await loadImage(urlOrImage).catch(() => null)
    : urlOrImage;
  if (!urlOrImage) return new Error("You provided an invaid image!");
  
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  
  ctx.drawImage(image, 0, 0);
  
  const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const pixelComponent = pixelData.length / 4;
  
  return { pixelData, pixelComponent };
}

async function averageColor(urlOrImage) {
  const { pixelData, pixelComponent } = await generatePixels(urlOrImage);
  const colorBits = [0, 0, 0, 0];
  
  for (let row = 0; row < pixelComponent * 4; row += image.width * 4) {
    for (let column = 0; column < image.width; column += 4) {
      colorBits[0] += pixelData[row + column];
      colorBits[1] += pixelData[row + column + 1];
      colorBits[2] += pixelData[row + column + 2];
      colorBits[3] += pixelData[row + column + 3];
    }
  }
  
  [ pixelComponent, colorBits, colorBits.map(colorBit => (colorBit / pixelComponent / 100) * 256)];
  
  const averagePixel = colorBits.map(colorBit => Math.floor((colorBit / pixelComponent / 100) * 256));
  
  return parseColor(`rgba(${averagePixel.join(",")}%)`);
}

function generateColor() {
  const randomHex = `#${Math.floor(Math.random() * MAX_HEX_DENARY).toString(16)}`;
  return parseColor(randomHex);
}

function renderColor(colorData = {}, useAlpha) {
  const selectedColor = typeof colorData === "string"
    ? colorData
    : useAlpha
      ? `rgba(${colorData.rgba.join(",")})`
      : colorData.hex;
  
  if (!colorData) return new Error("You provided an invalid color!");
  
  const canvas = createCanvas(COLOR_XY, COLOR_XY);
  const ctx = canvas.getContext("2d");
  
  ctx.fillStyle = selectedColor;
  ctx.fillRect(0, 0, COLOR_XY, COLOR_XY);
  
  return canvas.toBuffer("image/png");
}

function generatePalette() {
  const selectedColor = generateColor().hex;

  const scheme = new ColorScheme()
    .from_hex(selectedColor.slice(1))
    .scheme(schemes[~~(Math.random() * schemes.length)])
    .variation(variations[~~(Math.random() * variations.length)]);

  return scheme.colors();
}

function renderPalette(colorPalette) {
  if ((!colorPalette instanceof Array)) throw new Error("Invalid Color Scheme!");

  const canvas = createCanvas(PALETTE_Y * colorPalette.length, PALETTE_Y);
  const ctx = canvas.getContext("2d");

  colorPalette.forEach((hexColor, i) => {
    ctx.fillStyle = `#${hexColor}`;
    ctx.fillRect(i * PALETTE_Y, 0, PALETTE_Y, PALETTE_Y);
  })

  return canvas.toBuffer("image/png");
}

module.exports = {
  averageColor, generateColor, renderColor,
  generatePalette, renderPalette
};