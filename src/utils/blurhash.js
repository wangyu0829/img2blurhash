const sharp = require('sharp');
const { encode, decode } = require('blurhash');
const logger = require('./logger');
const cache = require('./cache');

/**
 * 从图片Buffer生成blurhash
 * @param {Buffer} buffer 图片数据
 * @param {Object} options 选项
 * @param {number} options.componentX 水平组件数量 (1-9)
 * @param {number} options.componentY 垂直组件数量 (1-9)
 * @param {number} options.resizeWidth 处理前调整图片宽度
 * @returns {Promise<Object>} 返回blurhash及图片信息
 */
async function getBlurhashFromBuffer(buffer, options = {}) {
  try {
    // 设置默认值
    const componentX = Math.min(9, Math.max(1, options.componentX || 4));
    const componentY = Math.min(9, Math.max(1, options.componentY || 3));
    const resizeWidth = options.resizeWidth || 32;
    
    // 检查缓存
    const cacheKey = cache.generateImageCacheKey(buffer) + 
                     `:${componentX}:${componentY}:${resizeWidth}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) return cachedResult;
    
    // 使用Sharp处理图片
    const image = sharp(buffer);
    
    // 获取原始图片信息
    const metadata = await image.metadata();
    
    // 调整图片大小并转换格式
    const { data, info } = await image
      .resize(resizeWidth, null, { fit: 'inside' })
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
    
    // 生成blurhash
    const blurhash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      componentX,
      componentY
    );
    
    // 构建结果对象
    const result = {
      blurhash,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length
      },
      settings: {
        componentX,
        componentY
      }
    };
    
    // 缓存结果
    cache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    logger.error('生成blurhash失败', { error: error.message });
    throw new Error(`生成blurhash失败: ${error.message}`);
  }
}

/**
 * 解码blurhash为PNG图片Buffer
 * @param {string} blurhash blurhash字符串
 * @param {number} width 输出图片宽度
 * @param {number} height 输出图片高度
 * @param {number} punch 对比度因子 (1 为标准)
 * @returns {Promise<Buffer>} PNG图片Buffer
 */
async function decodeBlurhash(blurhash, width = 32, height = 32, punch = 1) {
  try {
    // 检查缓存
    const cacheKey = `decode:${blurhash}:${width}:${height}:${punch}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) return cachedResult;
    
    // 解码blurhash获取像素数据
    const pixels = decode(blurhash, width, height, punch);
    
    // 创建原始图像数据的Buffer
    const buffer = Buffer.from(pixels);
    
    // 使用Sharp从原始数据生成PNG
    const pngBuffer = await sharp(buffer, {
      raw: {
        width,
        height,
        channels: 4
      }
    }).png().toBuffer();
    
    // 缓存结果
    cache.set(cacheKey, pngBuffer);
    
    return pngBuffer;
  } catch (error) {
    logger.error('解码blurhash失败', { error: error.message, blurhash });
    throw new Error(`解码blurhash失败: ${error.message}`);
  }
}

/**
 * 从URL生成blurhash
 * @param {string} url 图片URL
 * @param {Object} options blurhash选项
 * @returns {Promise<Object>} 返回blurhash及图片信息
 */
async function getBlurhashFromUrl(url, options = {}) {
  // URL的处理由调用方实现，这里只定义接口
  throw new Error('该方法需要在路由中实现');
}

module.exports = {
  getBlurhashFromBuffer,
  decodeBlurhash,
  getBlurhashFromUrl
};
