# ComfyUI Web 项目文档

## 项目简介

这是一个基于 React + TypeScript 的 ComfyUI Web 前端，用于远程控制 ComfyUI 进行 AI 绘画任务。

## 技术栈

- **前端框架**：React 19 + TypeScript 5.9
- **构建工具**：Vite 7.3
- **状态管理**：Zustand 5.0
- **样式方案**：Tailwind CSS 4 + Shadcn UI
- **后端代理**：Express 5.2 + http-proxy-middleware 3.0

## 项目结构

```
src/
  config/           # API 配置常量和 URL 生成
    api.ts
  services/         # 业务服务层
    comfyService.ts
  store/            # 状态管理（Zustand）
    use-comfy-store.ts
  hooks/            # 自定义 React Hooks
    useComfy.ts
  pages/            # 页面组件
    HomePage.tsx
  components/       # UI 组件
    ui/             # Shadcn 组件
    mode-toggle.tsx
    ...
  types/            # TypeScript 类型定义
  utils/            # 工具函数
  constants/        # 全局常量
  lib/              # 库函数
  assets/           # 静态资源
```

## 核心模块

### 1. **config/api.ts** - API 配置

定义了所有 API 端点和超时配置：
```typescript
- PROXY_PREFIX: '/api-comfy'   // 前端代理地址
- WS_PATH: '/ws'                // WebSocket 端点
- VIEW_PATH: '/view'             // 图片查看端点
- CONNECTION_TIMEOUT: 10秒       // WebSocket 连接超时
- REQUEST_TIMEOUT: 30秒          // HTTP 请求超时
```

### 2. **services/comfyService.ts** - 业务服务

负责与 ComfyUI 后端的所有通信：

**WebSocket 连接**（带自动超时）：
```typescript
comfyService.connect(clientId)  // 建立 WebSocket 连接
comfyService.disconnect()        // 断开连接
comfyService.on(event, callback) // 监听事件
```

**HTTP 请求**（所有请求都有 30秒超时保护）：
```typescript
getSystemStats()      // 获取系统信息
queuePrompt(workflow) // 提交生图任务
interrupt()           // 中断生成
clearQueue()          // 清空队列
uploadImage(file)     // 上传图片
```

### 3. **store/use-comfy-store.ts** - 状态管理

使用 Zustand 管理全局状态：
```typescript
- wsStatus        // WebSocket 连接状态: 'closed' | 'connecting' | 'open'
- username        // 当前用户名
- queueRemaining  // 队列中剩余任务数
- progress        // 当前任务进度
- previewBlobUrl  // 预览图片 URL
- lastError       // 最后一个错误信息
```

### 4. **hooks/useComfy.ts** - 自定义 Hooks

提供便捷的状态订阅接口：
```typescript
useComfyStatus()      // 获取连接和进度状态
useComfyActions()     // 获取操作方法（connect, disconnect等）
useComfyProgress()    // 获取进度百分比
useComfyPreview()     // 获取预览图片
useComfyConnection()  // 获取连接状态和方法
```

## 工作流程

```
前端 (React)
   ↓
config/api.ts (配置)
   ↓
services/comfyService.ts (服务)
   ↓
store/use-comfy-store.ts (状态)
   ↓
hooks/useComfy.ts (React Hooks)
   ↓
components (UI 组件)
   ↓
后端代理 (Express) → ComfyUI (8188)
```

## 环境配置

在项目根目录创建 `.env` 文件：

```bash
# ComfyUI 后端地址配置
VITE_COMFY_HOST=127.0.0.1    # 本地 ComfyUI
VITE_COMFY_PORT=8188         # ComfyUI 默认端口

# 或者远程地址
# VITE_COMFY_HOST=192.168.1.100
# VITE_COMFY_PORT=8188
```

前端代码自动通过 `localhost:3000` 访问，后端在 `main-server.js` 中配置代理规则。

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式（带热更新）
pnpm dev        # 访问 http://localhost:3000

# 生产构建
pnpm build      # 输出到 dist/

# 生产模式运行
pnpm preview

# 代码检查
pnpm lint
```

## 超时策略

### CONNECTION_TIMEOUT (10 秒)
- **场景**：建立 WebSocket 连接
- **触发**：网络不稳定、ComfyUI 无响应
- **处理**：自动断开，显示错误提示

### REQUEST_TIMEOUT (30 秒)
- **场景**：所有 HTTP 请求（提交任务、查询状态等）
- **包含**：系统信息查询、生图任务提交、图片上传
- **触发**：网络延迟、服务器卡顿
- **处理**：自动中止请求，抛出错误

**为什么是这些时间**？
- 10秒：足够处理网络连接的初始化
- 30秒：足够处理 ComfyUI 的模型加载和计算
- 防止无限期挂起，提升用户体验

## 错误处理

所有错误统一使用 `AppError` 类：
```typescript
interface AppError {
  code: string           // 错误代码（CONNECTION_TIMEOUT, QUEUE_ERROR等）
  message: string        // 用户友好的错误信息
  details?: any          // 详细信息（开发调试用）
}
```

## 事件系统

使用 EventTarget + CustomEvent 实现类型安全的事件系统：

```typescript
// 监听事件
comfyService.on('status', ({ queueRemaining }) => {
  console.log(`队列剩余: ${queueRemaining}`);
});

// 支持的事件
- 'status'            // 队列状态更新
- 'progress'          // 生成进度
- 'executing'         // 当前执行节点
- 'execution_start'   // 任务开始
- 'execution_success' // 任务成功
- 'execution_error'   // 任务失败
- 'b_preview'         // 图片预览（二进制）
- 'disconnected'      // 连接断开
```

## 下一步开发

### 待实现功能
1. **参数面板** - 编辑 ComfyUI 工作流参数
2. **流程编辑器** - 可视化编辑工作流
3. **预设管理** - 保存/加载工作流预设
4. **图片查看器** - 显示生成结果

### 开发建议
- 使用现有的 Hooks 获取状态和方法
- 参考 `HomePage.tsx` 的实现方式
- 新增组件放在 `components/` 目录
- 保持 TypeScript 类型安全

## 常见问题

**Q: 为什么前端只知道本地代理地址？**
A: 这是前后端分离的最佳实践。前端不需要关心真实的 ComfyUI 地址，由后端的 `.env` 文件管理。这样可以轻松切换 ComfyUI 地址（本地/远程）。

**Q: 超时了会怎样？**
A: 请求会被自动中止，触发错误处理流程，显示用户友好的错误信息。Store 中的 `lastError` 会被更新。

**Q: 如何调试 WebSocket 连接？**
A: 
1. 打开浏览器 DevTools → Network → WS
2. 查看 `ws://localhost:3000/api-comfy/ws` 连接
3. 查看浏览器控制台的 `[ComfyService]` 日志

**Q: 如何处理离线场景？**
A: 监听 `useComfyStatus()` 中的 `wsStatus` 状态，当为 'closed' 时显示离线界面。
