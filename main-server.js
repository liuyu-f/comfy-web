// main-server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. API 接口 (放在最前面)
  // --- 1. 后端逻辑：用户注册 ---
  app.use(express.json());
  
  // main-server.js 里的注册接口
	app.post('/api/register', (req, res) => {
    const { username } = req.body;
  
    // 1. 【安全检查】极其重要！防止恶意用户名操作你的服务器文件
    // 只允许字母、数字、下划线，过滤掉任何路径字符
    const safeUsername = username.replace(/[^a-zA-Z0-9_]/g, '');
    if (!safeUsername || safeUsername !== username) {
      return res.status(400).json({ message: '用户名格式非法，仅限字母数字下划线' });
    }
  
    // 2. 定义用户路径
    const userDir = path.join(__dirname, 'server_data', 'users', safeUsername);
    const configFile = path.join(userDir, 'config.json');
    const userOutputDir = path.join(userDir, 'outputs');
  
    // 3. 检查是否已存在
    if (fs.existsSync(userDir)) {
      return res.status(400).json({ message: '用户名已存在' });
    }
  
    try {
      // 4. 【递归创建】创建文件夹：server_data/users/用户名/outputs
      // recursive: true 会自动创建不存在的父级目录
      fs.mkdirSync(userOutputDir, { recursive: true });
  
      // 5. 【初始化配置】存入用户的初始信息
      const initialConfig = {
        username: safeUsername,
        createdAt: new Date().toISOString(),
        settings: {
          theme: 'dark',
          last_model: 'v1-5-pruned-emaonly.safetensors'
        }
      };
      fs.writeFileSync(configFile, JSON.stringify(initialConfig, null, 2));
  
      console.log(`[用户系统]: 已为 ${safeUsername} 创建独立存储空间`);
      res.json({ message: '注册成功', username: safeUsername });
  
    } catch (e) {
      console.error("创建用户目录失败:", e);
      res.status(500).json({ message: '服务器创建目录失败' });
    }
  });

  // 2. 代理 ComfyUI (HTTP 和 WS)
  const comfyProxy = createProxyMiddleware({
    target: 'http://127.0.0.1:8188',
    changeOrigin: true,
    pathRewrite: { '^/api-comfy': '' },
    on: {
      proxyReq: (proxyReq) => proxyReq.setHeader('Host', '127.0.0.1:8188'),
    }
  });
  app.use('/api-comfy', comfyProxy);

  const wsProxy = createProxyMiddleware({
    target: 'ws://127.0.0.1:8188',
    ws: true,
    changeOrigin: true,
    on: {
      proxyReqWs: (proxyReq) => proxyReq.setHeader('Origin', 'http://127.0.0.1:8188'),
    }
  });
  app.use('/ws', wsProxy);

  // 3. 集成 Vite 中间件
  // 这会处理 /src/main.tsx, /node_modules 等资源的加载
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  // 重要：Vite 的中间件必须在你的自定义 API 路由之后
  app.use(vite.middlewares);

	// 检查用户是否存在
	app.get('/api/check-user/:username', (req, res) => {
	  const { username } = req.params;
	  const safeUsername = username.replace(/[^a-zA-Z0-9_]/g, '');
	  const userDir = path.join(__dirname, 'server_data', 'users', safeUsername);
	
	  if (fs.existsSync(userDir)) {
	    res.json({ exists: true });
	  } else {
	    // 如果文件夹没了，告诉前端这个用户是非法的
	    res.status(404).json({ exists: false, message: '用户不存在' });
	  }
	});

  // 4. 【修正核心】处理 HTML 页面返回
  // 使用正则表达式 /.*/ 而不是字符串 "*" 或 "/*splat"
  // 这在 Express 5 中能完美匹配包括 "/" 在内的所有路径，且不会触发 PathError
  app.get(/.*/, async (req, res, next) => {
    // 排除掉接口请求，防止接口 404 时意外返回 HTML
    if (req.url.startsWith('/api') || req.url.startsWith('/api-comfy')) {
      return next();
    }

    try {
      const url = req.originalUrl;
      // 读取 index.html
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      
      // 使用 Vite 转换 HTML（注入热更新脚本和 React 入口）
      template = await vite.transformIndexHtml(url, template);
      
      // 使用 res.send 发送，Express 5 会自动处理 ETag 和 Content-Type
      res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  const server = app.listen(PORT, () => {
    console.log(`🚀 一体化工作站: http://localhost:${PORT}`);
  });

  // 处理 WebSocket 升级
  server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/ws')) {
      wsProxy.upgrade(req, socket, head);
    }
  });
}

startServer();