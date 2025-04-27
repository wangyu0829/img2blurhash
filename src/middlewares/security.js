/**
 * 安全相关中间件
 */
const { APIError } = require('./errorHandler');
const logger = require('../utils/logger');

// 简单的内存速率限制实现
const requestCounts = {};
const REQUEST_WINDOW = 60 * 1000; // 1分钟窗口
const MAX_REQUESTS_PER_WINDOW = 60; // 每分钟最多60个请求

/**
 * 请求速率限制中间件
 */
function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  
  // 初始化该IP的请求记录
  if (!requestCounts[ip]) {
    requestCounts[ip] = {
      count: 0,
      resetAt: now + REQUEST_WINDOW
    };
  }
  
  const record = requestCounts[ip];
  
  // 如果重置时间已过，重新开始计数
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + REQUEST_WINDOW;
  }
  
  // 检查是否超过限制
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    logger.warn(`请求频率限制: IP ${ip} 超过限制`, { ip });
    return next(new APIError('请求频率过高，请稍后再试', 429));
  }
  
  // 增加计数
  record.count++;
  
  // 添加剩余请求数到响应头
  res.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  res.set('X-RateLimit-Remaining', (MAX_REQUESTS_PER_WINDOW - record.count).toString());
  res.set('X-RateLimit-Reset', Math.floor(record.resetAt / 1000).toString());
  
  next();
}

/**
 * URL验证中间件
 */
function validateUrl(req, res, next) {
  const { url } = req.body;
  
  if (!url) {
    return next();
  }
  
  try {
    // 检查URL是否有效
    const parsedUrl = new URL(url);
    
    // 检查协议是否是http或https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new APIError('URL协议必须是http或https', 400);
    }
    
    // 检查是否是合法的图片URL（简单检查）
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      parsedUrl.pathname.toLowerCase().endsWith(ext)
    );
    
    if (!hasImageExtension) {
      logger.warn(`非图片URL: ${url}`, { url });
      // 不直接报错，只记录警告，因为有些URL可能没有扩展名但仍然是图片
    }
    
    next();
  } catch (error) {
    if (error instanceof APIError) {
      return next(error);
    }
    next(new APIError('无效的URL格式', 400, { url }));
  }
}

/**
 * 添加安全相关的响应头
 */
function securityHeaders(req, res, next) {
  // 防止clickjacking攻击
  res.set('X-Frame-Options', 'DENY');
  // 启用XSS过滤
  res.set('X-XSS-Protection', '1; mode=block');
  // 防止MIME类型嗅探
  res.set('X-Content-Type-Options', 'nosniff');
  
  next();
}

module.exports = {
  rateLimiter,
  validateUrl,
  securityHeaders
}; 