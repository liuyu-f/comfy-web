// main-server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ComfyUI 配置（与 api.ts 保持同步）
const COMFY_HOST = process.env.VITE_COMFY_HOST || '127.0.0.1';
const COMFY_PORT = parseInt(process.env.VITE_COMFY_PORT || '8188', 10);
const COMFY_URL = `http://${COMFY_HOST}:${COMFY_PORT}`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- 1. ComfyUI 代理配置 ---
  const comfyProxy = createProxyMiddleware({
    target: COMFY_URL,
    changeOrigin: true,
    ws: true, 
    // 关键：将所有 /api-comfy 开头的请求，去掉前缀后转发
    pathRewrite: { '^/api-comfy': '' }, 
    logger: console,
    on: {
      proxyReqWs: (proxyReq) => {
        // 部分 ComfyUI 版本需要校验 Origin 头部防止 403
        proxyReq.setHeader('Origin', COMFY_URL);
      },
    }
  });
  
  // 标准化，只需要这一行，就能接管所有以 /api-comfy 开头的流量
  app.use('/api-comfy', comfyProxy); 

  // --- 2. Vite 集成 (开发模式) ---
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  // --- 3. 渲染页面 ---
  app.get(/.*/, async (req, res, next) => {
    try {
      const url = req.originalUrl;
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      // 应用 Vite 的 HTML 转换，注入 HMR 脚本
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  const server = app.listen(PORT, () => {
    console.log(`\n  🚀 Web UI:  http://localhost:${PORT}`);
    console.log(`  🔗 Proxying: http://localhost:${PORT}/api-comfy -> ${COMFY_URL}\n`);
  });

  // --- 4. 关键：处理 WebSocket 升级 ---
  server.on('upgrade', (req, socket, head) => {
    // 此时客户端连接的 URL 将会是 ws://localhost:3000/api-comfy/ws
    if (req.url.startsWith('/api-comfy/ws')) {
      comfyProxy.upgrade(req, socket, head);
    }
  });
}

startServer();