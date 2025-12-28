// src/lib/comfy-api.ts

// 定义基础路径，匹配 vite.config.ts 里的代理配置
const API_BASE = '/api-comfy';
const VIEW_BASE = '/view';
const WS_PATH = '/ws';

export interface SystemStats {
  system: { os: string; python_version: string };
  devices: any[];
}

export const comfyApi = {
  // 1. 获取系统状态 (HTTP)
  getSystemStats: async (): Promise<SystemStats> => {
    const res = await fetch(`${API_BASE}/system_stats`);
    if (!res.ok) throw new Error('Failed to fetch system stats');
    return res.json();
  },

  // 2. 获取图片 URL (HTTP)
  // 供 <img> 标签使用：<img src={comfyApi.getImageUrl('test.png')} />
  getImageUrl: (filename: string, subfolder = '', type = 'output') => {
    const params = new URLSearchParams({ filename, subfolder, type });
    return `${VIEW_BASE}?${params.toString()}`;
  },

  // 3. 建立 WebSocket 连接
  // 返回原生的 WebSocket 对象，让外部去监听
  createWebSocket: (clientId: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // 连接到代理路径 /ws，由 Vite 转发并伪装 Origin
    return new WebSocket(`${protocol}//${host}${WS_PATH}?clientId=${clientId}`);
  }
};