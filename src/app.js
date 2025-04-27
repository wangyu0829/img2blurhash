/**
 * Blurhash API 服务主应用
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const blurhashRouter = require('./routes/blurhash');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { rateLimiter, securityHeaders } = require('./middlewares/security');
const logger = require('./utils/logger');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 确保目录存在
const uploadsDir = path.join(__dirname, '../uploads');
const logsDir = path.join(__dirname, '../logs');

[uploadsDir, logsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 安全中间件
app.use(rateLimiter);
app.use(securityHeaders);

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// API路由
app.use('/api/blurhash', blurhashRouter);

// 健康检查
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Blurhash API 服务已启动',
    version: require('../package.json').version,
    timestamp: new Date().toISOString()
  });
});

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Blurhash API 服务已启动: http://localhost:${PORT}`);
  logger.info(`服务器已启动，监听端口 ${PORT}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error: error.message, stack: error.stack });
  console.error('未捕获的异常:', error);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { reason: reason.toString() });
  console.error('未处理的Promise拒绝:', reason);
});

module.exports = app;
