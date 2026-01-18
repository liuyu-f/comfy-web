/**
 * API 配置文件
 * 集中管理前端与代理服务器之间的 API 常量和端点生成
 * 
 * 注意：前端只需要知道本地代理地址 (/api-comfy/...)
 * 实际的 ComfyUI 后端地址由服务器的 .env 文件管理
 */

export const API_CONFIG = {
  // 前端代理配置
  PROXY_PREFIX: '/api-comfy',
  WS_PATH: '/ws',
  VIEW_PATH: '/view',
} as const;

/**
 * 获取 ComfyUI WebSocket URL（本地代理地址）
 */
export function getComfyWebSocketUrl(clientId: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}${API_CONFIG.PROXY_PREFIX}${API_CONFIG.WS_PATH}?clientId=${clientId}`;
}

/**
 * 获取 ComfyUI 图片 URL（本地代理地址）
 */
export function getComfyImageUrl(
  filename: string,
  subfolder: string = '',
  type: string = 'output'
): string {
  const params = new URLSearchParams({ filename, subfolder, type });
  return `${API_CONFIG.PROXY_PREFIX}${API_CONFIG.VIEW_PATH}?${params.toString()}`;
}
