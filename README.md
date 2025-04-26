# Blurhash API 服务

本项目基于 Node.js + Express，提供图片 blurhash 计算的 API。

## 功能
- 上传图片，返回 blurhash
- 提交图片 URL，返回 blurhash

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 启动服务

```bash
npm start
```

3. API 说明

### 上传图片
- 路径：`POST /api/blurhash/upload`
- 表单字段：`image`（文件）
- 返回：`{ blurhash: "..." }`

### 通过 URL 获取 blurhash
- 路径：`POST /api/blurhash/url`
- Body: `{ "url": "图片地址" }`
- 返回：`{ blurhash: "..." }`

## 目录结构
```
/windsurf_demo
├── src/
│   ├── app.js
│   ├── routes/
│   │   └── blurhash.js
│   └── utils/
│       └── blurhash.js
├── uploads/
├── package.json
├── README.md
├── Progress.md
├── Lesson.md
└── ProjectStatus.md
```

## 依赖
- express
- multer
- axios
- sharp
- blurhash

## 注意事项
- 上传图片最大 5MB。
- URL 方式支持公网图片。
- 返回统一 JSON 格式。

---

如遇问题，请查看 Progress.md、ProjectStatus.md、Lesson.md。
# img2blurhash
