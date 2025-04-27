/**
 * 全局错误处理中间件
 */
const logger = require('../utils/logger');

/**
 * 自定义API错误类
 */
class APIError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404错误处理中间件
 */
function notFoundHandler(req, res, next) {
  const error = new APIError(`路径不存在: ${req.originalUrl}`, 404);
  next(error);
}

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 确定状态码（默认500）
  const statusCode = err.statusCode || 500;
  
  // 准备错误响应
  const errorResponse = {
    error: {
      message: err.message || '服务器内部错误',
      status: statusCode
    }
  };
  
  // 非生产环境下，添加错误详情
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
    if (err.details) {
      errorResponse.error.details = err.details;
    }
  }
  
  // 记录错误日志
  logger.error(`${statusCode} - ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    ...(err.details || {})
  });
  
  // 发送错误响应
  res.status(statusCode).json(errorResponse);
}

module.exports = {
  APIError,
  notFoundHandler,
  errorHandler
}; 