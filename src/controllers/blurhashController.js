/**
 * Blurhash控制器
 */
const fs = require('fs');
const axios = require('axios');
const { getBlurhashFromBuffer, decodeBlurhash } = require('../utils/blurhash');
const logger = require('../utils/logger');
const { APIError } = require('../middlewares/errorHandler');
const cache = require('../utils/cache');

/**
 * 从上传的图片文件生成blurhash
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 * @param {Function} next 下一个中间件
 */
async function generateFromUpload(req, res, next) {
  try {
    if (!req.file) {
      throw new APIError('未检测到上传图片', 400);
    }
    
    // 提取请求参数
    const componentX = parseInt(req.body.componentX) || 4;
    const componentY = parseInt(req.body.componentY) || 3;
    const options = { componentX, componentY };
    
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    
    // 生成blurhash
    const result = await getBlurhashFromBuffer(buffer, options);
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    // 记录成功日志
    logger.info('成功处理上传图片', {
      filename: req.file.originalname,
      size: req.file.size,
      componentX,
      componentY
    });
    
    res.json(result);
  } catch (error) {
    // 确保清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
}

/**
 * 从URL生成blurhash
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 * @param {Function} next 下一个中间件
 */
async function generateFromUrl(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) {
      throw new APIError('缺少url参数', 400);
    }
    
    // 提取请求参数
    const componentX = parseInt(req.body.componentX) || 4;
    const componentY = parseInt(req.body.componentY) || 3;
    const options = { componentX, componentY };
    
    // 检查URL缓存
    const cacheKey = cache.generateUrlCacheKey(url) + 
                     `:${componentX}:${componentY}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    // 下载图片
    logger.info(`从URL下载图片: ${url}`);
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 10000, // 10秒超时
      maxContentLength: 10 * 1024 * 1024 // 限制10MB
    });
    
    // 检查内容类型
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      throw new APIError('URL不是图片资源', 400, { contentType });
    }
    
    const buffer = Buffer.from(response.data);
    
    // 生成blurhash
    const result = await getBlurhashFromBuffer(buffer, options);
    
    // 缓存结果
    cache.set(cacheKey, result);
    
    // 记录成功日志
    logger.info('成功处理URL图片', {
      url,
      size: buffer.length,
      contentType,
      componentX,
      componentY
    });
    
    res.json(result);
  } catch (error) {
    if (error.response) {
      // 远程服务器返回错误
      const statusCode = error.response.status;
      next(new APIError(`获取图片失败: HTTP ${statusCode}`, 400, {
        url: req.body.url,
        statusCode
      }));
    } else if (error.request) {
      // 请求发送但没有收到响应
      next(new APIError('获取图片超时或无响应', 400, {
        url: req.body.url
      }));
    } else {
      next(error);
    }
  }
}

/**
 * 解码blurhash并返回预览图
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 * @param {Function} next 下一个中间件
 */
async function decodeHash(req, res, next) {
  try {
    const { blurhash } = req.params;
    if (!blurhash) {
      throw new APIError('缺少blurhash参数', 400);
    }
    
    // 提取请求参数
    const width = parseInt(req.query.width) || 32;
    const height = parseInt(req.query.height) || 32;
    const punch = parseFloat(req.query.punch) || 1.0;
    
    // 验证参数
    if (width <= 0 || width > 1000 || height <= 0 || height > 1000) {
      throw new APIError('宽度和高度必须在1-1000之间', 400);
    }
    
    if (punch <= 0 || punch > 10) {
      throw new APIError('对比度因子必须在0-10之间', 400);
    }
    
    // 解码blurhash为PNG图片
    const pngBuffer = await decodeBlurhash(blurhash, width, height, punch);
    
    // 设置响应头
    res.set('Content-Type', 'image/png');
    res.set('Content-Length', pngBuffer.length);
    res.set('Cache-Control', 'public, max-age=86400'); // 缓存24小时
    
    // 发送图片数据
    res.send(pngBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * 批量处理多个URL
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 * @param {Function} next 下一个中间件
 */
async function batchProcess(req, res, next) {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new APIError('缺少urls参数或格式不正确', 400);
    }
    
    if (urls.length > 10) {
      throw new APIError('批量处理最多支持10个URL', 400);
    }
    
    // 提取请求参数
    const componentX = parseInt(req.body.componentX) || 4;
    const componentY = parseInt(req.body.componentY) || 3;
    const options = { componentX, componentY };
    
    // 并行处理所有URL
    const promises = urls.map(async (url) => {
      try {
        // 检查URL缓存
        const cacheKey = cache.generateUrlCacheKey(url) + 
                         `:${componentX}:${componentY}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return { url, ...cachedResult, cached: true };
        }
        
        // 下载图片
        const response = await axios.get(url, { 
          responseType: 'arraybuffer',
          timeout: 10000,
          maxContentLength: 10 * 1024 * 1024
        });
        
        // 检查内容类型
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          return { url, error: 'URL不是图片资源' };
        }
        
        const buffer = Buffer.from(response.data);
        
        // 生成blurhash
        const result = await getBlurhashFromBuffer(buffer, options);
        
        // 缓存结果
        cache.set(cacheKey, result);
        
        return { url, ...result };
      } catch (error) {
        return { 
          url, 
          error: error.message,
          details: error.response ? `HTTP ${error.response.status}` : '网络错误'
        };
      }
    });
    
    const results = await Promise.all(promises);
    
    // 记录成功日志
    logger.info('批量处理URL完成', {
      totalUrls: urls.length,
      successCount: results.filter(r => !r.error).length,
      componentX,
      componentY
    });
    
    res.json({ results });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateFromUpload,
  generateFromUrl,
  decodeHash,
  batchProcess
}; 