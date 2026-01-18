// src/hooks/useComfy.ts
// 自定义 Hooks - 封装常见的 Comfy 操作

import { useComfyStore } from '@/store/use-comfy-store';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

/**
 * 使用 ComfyUI 连接状态的 Hook
 */
export function useComfyStatus() {
  return useComfyStore(
    useShallow((state) => ({
      wsStatus: state.wsStatus,
      queueRemaining: state.queueRemaining,
      progress: state.progress,
      executingNodeId: state.executingNodeId,
      currentPromptId: state.currentPromptId,
      previewBlobUrl: state.previewBlobUrl,
      lastError: state.lastError,
    }))
  );
}

/**
 * 使用 ComfyUI 连接动作的 Hook
 */
export function useComfyActions() {
  return useComfyStore(
    useShallow((state) => ({
      connect: state.connect,
      disconnect: state.disconnect,
      interrupt: state.interrupt,
      clearQueue: state.clearQueue,
      logout: state.logout,
      clearError: state.clearError,
    }))
  );
}

/**
 * 使用进度的 Hook
 */
export function useComfyProgress() {
  const progress = useComfyStore((state) => state.progress);
  const percentage = progress ? Math.round((progress.value / progress.max) * 100) : 0;
  const isLoading = progress !== null;

  return {
    progress,
    percentage,
    isLoading,
  };
}

/**
 * 使用预览图的 Hook
 */
export function useComfyPreview() {
  return useComfyStore(
    useShallow((state) => ({
      previewBlobUrl: state.previewBlobUrl,
      hasPreview: state.previewBlobUrl !== null,
    }))
  );
}

/**
 * 使用连接的 Hook - 自动清理
 */
export function useComfyConnection() {
  const { connect, disconnect } = useComfyActions();
  const wsStatus = useComfyStore((state) => state.wsStatus);

  const handleConnect = useCallback(async (name: string) => {
    await connect(name);
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    wsStatus,
    connect: handleConnect,
    disconnect: handleDisconnect,
    isConnected: wsStatus === 'open',
    isConnecting: wsStatus === 'connecting',
  };
}
