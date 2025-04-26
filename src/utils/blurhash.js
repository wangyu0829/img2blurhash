const sharp = require('sharp');
const { encode } = require('blurhash');

/**
 * 从图片 Buffer 生成 blurhash
 * @param {Buffer} buffer 
 * @returns {Promise<string>} blurhash
 */
async function getBlurhashFromBuffer(buffer) {
  // 推荐缩放到较小尺寸，加快处理速度
  const { data, info } = await sharp(buffer)
    .resize(32, 32, { fit: 'inside' })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  // 生成 blurhash
  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
}

module.exports = { getBlurhashFromBuffer };
