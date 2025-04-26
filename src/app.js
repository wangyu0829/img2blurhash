const express = require('express');
const blurhashRouter = require('./routes/blurhash');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(express.json());
app.use('/api/blurhash', blurhashRouter);

// 健康检查
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Blurhash API 服务已启动' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
