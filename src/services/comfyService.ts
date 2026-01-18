/**
 * ComfyUI 服务层
 * 负责处理与 ComfyUI 后端的所有通信
 * - WebSocket 连接管理
 * - HTTP 请求处理
 * - 事件分发
 */

import type {
  SystemStats,
  PromptQueueResponse,
  ImageUploadResponse,
  ComfyEventMap,
} from '@/types';
import { API_CONFIG, getComfyWebSocketUrl, getComfyImageUrl } from '@/config/api';
import { MESSAGES} from '@/constants';

const API_BASE = API_CONFIG.PROXY_PREFIX;

// 事件类型
type ComfyEventType = keyof ComfyEventMap;

/**
 * ComfyService 类
 * 
 * 专门负责与 ComfyUI 后端交互
 * - 管理 WebSocket 连接
 * - 处理 HTTP 请求
 * - 事件分发
 */
export class ComfyService extends EventTarget {
  private ws: WebSocket | null = null;
  private clientId: string | null = null;

  /**
   * 注册事件监听
   * @param event 事件名称
   * @param callback 回调函数
   * @param options 监听选项
   */
  on<K extends ComfyEventType>(
    event: K,
    callback: (data: ComfyEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) {
    this.addEventListener(event, (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail);
    }, options);
    return this;
  }

  /**
   * 触发事件
   */
  private emit<K extends ComfyEventType>(event: K, data?: ComfyEventMap[K]) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  /**
   * 建立 WebSocket 连接
   */
  connect(clientId: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      this.clientId = clientId;
      if (this.ws) {
        this.disconnect();
      }

      const url = getComfyWebSocketUrl(clientId);
      console.log(`[ComfyService] 正在连接到: ${url}`);

      try {
        this.ws = new WebSocket(url);
        this.ws.binaryType = "arraybuffer";

        const timeout = setTimeout(() => {
          reject(new Error(MESSAGES.CONNECTION_TIMEOUT));
          this.ws?.close();
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('[ComfyService] WebSocket 连接建立');
          if (this.ws) resolve(this.ws);
        };

        this.ws.onclose = () => {
          console.log('[ComfyService] WebSocket 连接已关闭');
          this.emit('disconnected', undefined);
        };

        this.ws.onerror = (err) => {
          clearTimeout(timeout);
          console.error('[ComfyService] WebSocket 错误:', err);
          reject(new Error(MESSAGES.WS_CONNECTION_ERROR));
        };

        this.ws.addEventListener('message', (event) => {
          this.handleMessage(event);
        });
      } catch (error) {
        reject(new Error(MESSAGES.CONNECTION_CREATE_FAILED));
      }
    });
  }

  /**
   * 内部消息处理
   */
  private handleMessage(event: MessageEvent) {
    if (event.data instanceof ArrayBuffer) {
      this.emit('b_preview', event.data);
    } else {
      try {
        const msg = JSON.parse(event.data as string);
        this.routeMessage(msg);
      } catch (e) {
        console.error("[ComfyService] 解析消息失败:", e);
      }
    }
  }

  /**
   * 路由消息到不同的处理器
   */
  private routeMessage(msg: Record<string, any>) {
    if (!msg.type) return;

    switch (msg.type) {
      case 'status':
        this.emit('status', {
          queueRemaining: msg.data?.status?.exec_info?.queue_remaining ?? 0,
        });
        break;
      case 'progress':
        this.emit('progress', {
          value: msg.data?.value ?? 0,
          max: msg.data?.max ?? 0,
        });
        break;
      case 'executing':
        this.emit('executing', msg.data.node ?? null);
        break;
      case 'execution_start':
        this.emit('execution_start', msg.data);
        break;
      case 'execution_success':
      case 'execution_error':
        this.emit(msg.type, msg.data);
        break;
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
      this.clientId = null;
      console.log("[ComfyService] 已断开连接");
    }
  }

  /**
   * 获取系统状态
   */
  async getSystemStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/system_stats`);
    if (!res.ok) {
      throw new Error(MESSAGES.FETCH_SYS_STATS_FAILED);
    }
    return res.json();
  }

  /**
   * 提交生图任务
   */
  async queuePrompt(
    workflowJson: Record<string, any>,
    clientId?: string
  ): Promise<PromptQueueResponse> {
    const targetClientId = clientId || this.clientId;
    if (!targetClientId) {
      throw new Error(MESSAGES.NO_CLIENT_ID);
    }

    const res = await fetch(`${API_BASE}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: workflowJson,
        client_id: targetClientId,
      }),
    });

    if (!res.ok) {
      throw new Error(MESSAGES.QUEUE_FAILED);
    }
    return res.json();
  }

  /**
   * 中断生成
   */
  async interrupt(): Promise<void> {
    const res = await fetch(`${API_BASE}/interrupt`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(MESSAGES.INTERRUPT_FAILED);
    }
  }

  /**
   * 清空队列
   */
  async clearQueue(): Promise<void> {
    const res = await fetch(`${API_BASE}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clear: true }),
    });
    if (!res.ok) {
      throw new Error(MESSAGES.CLEAR_FAILED);
    }
  }

  /**
   * 上传图片
   */
  async uploadImage(
    file: File,
    type = 'input',
    overwrite = false
  ): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    formData.append('overwrite', String(overwrite).toLowerCase());

    const res = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(MESSAGES.UPLOAD_IMAGE_FAILED);
    }
    return res.json();
  }

  /**
   * 获取图片 URL
   */
  getImageUrl(filename: string, subfolder = '', type = 'output'): string {
    return getComfyImageUrl(filename, subfolder, type);
  }
}

// 导出单例
export const comfyService = new ComfyService();
