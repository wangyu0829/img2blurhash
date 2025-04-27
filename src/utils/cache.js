/**
 * 简单的内存缓存实现
 */
const crypto = require('crypto');
const logger = require('./logger');

// 缓存配置
const DEFAULT_TTL = 3600 * 1000; // 1小时过期
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 每10分钟清理一次过期缓存

// 缓存存储
const cache = new Map();

/**
 * 为图片生成缓存键
 * @param {Buffer} imageBuffer 图片数据
 * @returns {string} 缓存键
 */
function generateImageCacheKey(imageBuffer) {
  return crypto.createHash('md5').update(imageBuffer).digest('hex');
}

/**
 * 为URL生成缓存键
 * @param {string} url 图片URL
 * @returns {string} 缓存键
 */
function generateUrlCacheKey(url) {
  return 'url:' + crypto.createHash('md5').update(url).digest('hex');
}

/**
 * 从缓存中获取项目
 * @param {string} key 缓存键
 * @returns {*|null} 缓存的值，如不存在则返回null
 */
function get(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  // 检查是否过期
  if (item.expiry && item.expiry < Date.now()) {
    cache.delete(key);
    return null;
  }
  
  logger.debug(`缓存命中: ${key}`);
  return item.value;
}

/**
 * 将项目存入缓存
 * @param {string} key 缓存键
 * @param {*} value 要缓存的值
 * @param {number} [ttl] 过期时间（毫秒）
 */
function set(key, value, ttl = DEFAULT_TTL) {
  const expiry = ttl ? Date.now() + ttl : null;
  cache.set(key, { value, expiry });
  logger.debug(`缓存设置: ${key}, TTL: ${ttl}ms`);
}

/**
 * 清理过期的缓存项
 */
function cleanup() {
  const now = Date.now();
  let count = 0;
  
  for (const [key, item] of cache.entries()) {
    if (item.expiry && item.expiry < now) {
      cache.delete(key);
      count++;
    }
  }
  
  if (count > 0) {
    logger.info(`清理了 ${count} 个过期缓存项`);
  }
}

// 定期清理过期缓存
setInterval(cleanup, CACHE_CLEANUP_INTERVAL);

module.exports = {
  generateImageCacheKey,
  generateUrlCacheKey,
  get,
  set
}; 