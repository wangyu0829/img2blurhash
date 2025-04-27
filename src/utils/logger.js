/**
 * 简单的日志工具
 */
const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');

// 确保日志目录存在
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 创建日志写入流
const accessLogStream = createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
const errorLogStream = createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });

/**
 * 记录日志
 * @param {string} level 日志级别
 * @param {string} message 日志消息
 * @param {Object} [meta] 附加数据
 */
function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };
  
  const logString = JSON.stringify(logEntry) + '\n';
  
  // 根据日志级别写入不同的日志文件
  if (level === 'error') {
    errorLogStream.write(logString);
    console.error(`[${timestamp}] [ERROR] ${message}`);
  } else {
    accessLogStream.write(logString);
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  debug: (message, meta) => log('debug', message, meta)
}; 