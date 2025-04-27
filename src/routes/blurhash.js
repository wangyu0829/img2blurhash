/**
 * Blurhash 路由
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const blurhashController = require('../controllers/blurhashController');
const { validateUrl } = require('../middlewares/security');

const router = express.Router();

// 配置文件上传
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 限制
    files: 1 // 一次只允许上传一个文件
  },
  fileFilter: (req, file, cb) => {
    // 只接受图片文件
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('只能上传图片文件'), false);
    }
    cb(null, true);
  }
});

// 上传图片生成blurhash
router.post('/upload', upload.single('image'), blurhashController.generateFromUpload);

// 通过URL生成blurhash
router.post('/url', validateUrl, blurhashController.generateFromUrl);

// 批量处理URL
router.post('/batch', validateUrl, blurhashController.batchProcess);

// 解码blurhash并返回预览图
router.get('/decode/:blurhash', blurhashController.decodeHash);

module.exports = router;
