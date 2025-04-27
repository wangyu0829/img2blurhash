# Blurhash API 服务

本项目基于 Node.js + Express，提供图片 blurhash 计算的 API。

## 功能
- 上传图片，返回 blurhash
- 提交图片 URL，返回 blurhash
- 批量处理多个图片 URL
- 解码 blurhash 生成预览图片
- 支持自定义 blurhash 参数
- 缓存机制减少重复处理
- 请求限流保护服务器

## 快速开始

1. 安装依赖

```bash
npm install
# 或使用 pnpm
pnpm install
```

2. 启动服务

```bash
npm start
# 或使用 pnpm
pnpm start
```

3. API 说明

### 上传图片
- 路径：`POST /api/blurhash/upload`
- 表单字段：
  - `image`（文件）：要处理的图片
  - `componentX`（可选）：水平组件数量，默认 4
  - `componentY`（可选）：垂直组件数量，默认 3
- 返回：包含 blurhash 值和图片元数据

### 通过 URL 获取 blurhash
- 路径：`POST /api/blurhash/url`
- Body: 
```json
{
  "url": "图片地址",
  "componentX": 4,
  "componentY": 3
}
```
- 返回：包含 blurhash 值和图片元数据

### 批量处理 URL
- 路径：`POST /api/blurhash/batch`
- Body:
```json
{
  "urls": ["图片地址1", "图片地址2", ...],
  "componentX": 4,
  "componentY": 3
}
```
- 返回：包含每个 URL 的处理结果

### 解码 blurhash 为图片
- 路径：`GET /api/blurhash/decode/:blurhash`
- 参数：
  - `width`（可选）：输出图片宽度，默认 32
  - `height`（可选）：输出图片高度，默认 32
  - `punch`（可选）：对比度因子，默认 1.0
- 返回：PNG 格式的图片

## 目录结构
```
/img2blurhash
├── src/
│   ├── app.js                 # 主应用入口
│   ├── routes/                # 路由定义
│   │   └── blurhash.js        # blurhash API 路由
│   ├── controllers/           # 控制器层
│   │   └── blurhashController.js # blurhash 业务逻辑
│   ├── middlewares/           # 中间件
│   │   ├── errorHandler.js    # 错误处理
│   │   └── security.js        # 安全相关中间件
│   └── utils/                 # 工具函数
│       ├── blurhash.js        # blurhash 处理函数
│       ├── cache.js           # 缓存实现
│       └── logger.js          # 日志工具
├── uploads/                   # 上传文件临时目录
├── logs/                      # 日志目录
├── package.json
├── README.md
├── Progress.md                # 项目进度
├── Lesson.md                  # 经验总结
└── ProjectStatus.md           # 项目状态记录
```

## 依赖
- express - Web 服务框架
- multer - 处理文件上传
- axios - 获取远程图片
- sharp - 图像处理
- blurhash - 生成和解码 blurhash

## 注意事项
- 上传图片最大 5MB
- URL 请求限制 10MB
- 批量处理最多支持 10 个 URL
- 每分钟最多接受 60 个请求
- 返回统一 JSON 格式

---

如遇问题，请查看 Progress.md、ProjectStatus.md、Lesson.md。
# img2blurhash
