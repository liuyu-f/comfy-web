// src/store/use-comfy-store.ts
// 状态管理层 - 使用 Zustand 管理全局状态

import { create } from "zustand";
import { comfyService } from '@/services/comfyService';
import type { ConnectionStatus } from "@/types";
import { MESSAGES, STORAGE_KEYS } from '@/constants';

interface ComfyState {
  // 连接状态
  username: string | null;
  wsStatus: ConnectionStatus;
  listenerController: AbortController | null;

  // 任务进度
  queueRemaining: number;
  progress: { value: number; max: number } | null;
  executingNodeId: string | null;
  currentPromptId: string | null;

  // 预览
  previewBlobUrl: string | null;

  // 错误处理
  lastError: string | null;

  // 动作
  connect: (username: string) => Promise<void>;
  disconnect: () => void;
  interrupt: () => Promise<void>;
  clearQueue: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

/**
 * 创建 Zustand Store
 * 
 * 职责：
 * - 管理 WebSocket 连接生命周期
 * - 维护全局状态
 * - 处理事件监听
 */
export const useComfyStore = create<ComfyState>((set, get) => ({
  // 初始状态
  username: localStorage.getItem(STORAGE_KEYS.USERNAME),
  wsStatus: "closed",
  listenerController: null,
  queueRemaining: 0,
  progress: null,
  executingNodeId: null,
  currentPromptId: null,
  previewBlobUrl: null,
  lastError: null,

  // 连接
  connect: async (username: string) => {
    const { wsStatus } = get();

    // 防抖保护
    if (wsStatus === "open" || wsStatus === "connecting") return;

    set({ wsStatus: "connecting", lastError: null });

    try {
      await comfyService.connect(username);

      // 检查是否被主动断开
      if (get().wsStatus === "closed") return;

      set({ wsStatus: "open", username });
      localStorage.setItem(STORAGE_KEYS.USERNAME, username);

      // 设置事件监听控制器
      if (get().listenerController) {
        get().listenerController?.abort();
      }

      const controller = new AbortController();
      set({ listenerController: controller });

      // 监听所有事件
      comfyService.on('disconnected', () => {
        if (get().wsStatus !== "closed") {
          console.log("[Store] 检测到被动断开");
          set({ wsStatus: "closed" });
        }
      }, { signal: controller.signal });

      comfyService.on('status', ({ queueRemaining }) => {
        set({ queueRemaining });
      }, { signal: controller.signal });

      comfyService.on('progress', (progress) => {
        set({ progress });
      }, { signal: controller.signal });

      comfyService.on('executing', (nodeId) => {
        set({ executingNodeId: nodeId });
      }, { signal: controller.signal });

      comfyService.on('execution_start', (data) => {
        set({ currentPromptId: data.prompt_id });
      }, { signal: controller.signal });

      comfyService.on('b_preview', (blobData: ArrayBuffer) => {
        const oldUrl = get().previewBlobUrl;
        if (oldUrl) URL.revokeObjectURL(oldUrl);

        const blob = new Blob([blobData], { type: 'image/jpeg' });
        const newUrl = URL.createObjectURL(blob);
        set({ previewBlobUrl: newUrl });
      }, { signal: controller.signal });

      const handleFinished = () => {
        set({
          progress: null,
          executingNodeId: null,
          currentPromptId: null,
        });
      };
      comfyService.on('execution_success', handleFinished, { signal: controller.signal });
      comfyService.on('execution_error', handleFinished, { signal: controller.signal });

    } catch (error) {
      const message = error instanceof Error ? error.message : MESSAGES.CONNECTION_FAILED;
      console.error("[Store] 连接失败:", error);
      set({ wsStatus: "closed", lastError: message });
    }
  },

  // 断开连接
  disconnect: () => {
    comfyService.disconnect();

    const { listenerController, previewBlobUrl } = get();
    if (listenerController) {
      listenerController.abort();
    }
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }

    set({
      wsStatus: "closed",
      previewBlobUrl: null,
      listenerController: null,
    });
  },

  // 中断生成
  interrupt: async () => {
    try {
      set({ lastError: null });
      await comfyService.interrupt();
    } catch (error) {
      const message = error instanceof Error ? error.message : MESSAGES.INTERRUPT_FAILED;
      console.error("[Store] 中断执行失败:", error);
      set({ lastError: message });
    }
  },

  // 清空队列
  clearQueue: async () => {
    try {
      set({ lastError: null });
      await comfyService.clearQueue();
      set({ queueRemaining: 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : MESSAGES.CLEAR_FAILED;
      console.error("[Store] 清空队列失败:", error);
      set({ lastError: message });
    }
  },

  // 退出登录
  logout: () => {
    get().disconnect();
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    set({
      username: null,
      wsStatus: "closed",
      queueRemaining: 0,
      progress: null,
      executingNodeId: null,
      currentPromptId: null,
      previewBlobUrl: null,
      listenerController: null,
      lastError: null,
    });
  },

  // 清除错误
  clearError: () => {
    set({ lastError: null });
  },
}));
