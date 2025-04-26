const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { getBlurhashFromBuffer } = require('../utils/blurhash');

const router = express.Router();

// 配置 multer
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
});

// 上传图片接口
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未检测到上传图片' });
    }
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const blurhash = await getBlurhashFromBuffer(buffer);
    // 删除临时文件
    fs.unlinkSync(filePath);
    res.json({ blurhash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 通过 URL 获取图片并生成 blurhash
router.post('/url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: '缺少 url 参数' });
    }
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const blurhash = await getBlurhashFromBuffer(buffer);
    res.json({ blurhash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
