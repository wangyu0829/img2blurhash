# 错误教训与经验积累（Lesson.md）

- 推荐使用 sharp 处理图片，blurhash 仅支持 RGB 数据。
- 图片上传建议用 multer，URL 方式建议用 axios 获取 Buffer。
- blurhash.encode 需要传入 Uint8ClampedArray 类型的像素数据。
- Node.js 处理图片时注意异步流程。
- 错误处理要详细，返回统一的 JSON 格式。
