// src/constants/index.ts
// 全局常量定义

/**
 * 应用级别常量
 */
export const APP_NAME = 'ComfyUI Console';
export const APP_VERSION = '0.1.0';

/**
 * 存储键
 */
export const STORAGE_KEYS = {
  THEME: 'comfy-ui-theme',
  USERNAME: 'comfy-username',
} as const;

/**
 * 提示消息
 */
export const MESSAGES = {
  CONNECTION_SUCCESS: '连接成功',
  CONNECTION_FAILED: '连接失败',
  DISCONNECTED: '已断开连接',
  QUEUE_SUBMITTED: '任务已提交',
  QUEUE_FAILED: '任务提交失败',
  INTERRUPT_SUCCESS: '已中断执行',
  INTERRUPT_FAILED: '中断执行失败',
  CLEAR_SUCCESS: '队列已清空',
  CLEAR_FAILED: '清空队列失败',
  CONNECTION_TIMEOUT: '连接超时',
  WS_CONNECTION_ERROR: 'WebSocket 连接错误',
  CONNECTION_CREATE_FAILED: '创建连接失败',
  FETCH_SYS_STATS_FAILED: '获取系统信息失败',
  UPLOAD_IMAGE_FAILED: '图片上传失败',
  NO_CLIENT_ID: '未连接且未提供 clientId',
  DISCONNECT: '断开连接',
  CONNECTING: '连接中...',
  CONNECT: '连接',
  CONNECTED: '已连接',
  NOT_CONNECTED: '未连接',
  ERROR_TITLE: '错误',
  UNKNOWN_ERROR: '发生未知错误',
} as const;

/**
 * 状态映射
 */
export const STATUS_LABELS = {
  open: '已连接',
  connecting: '连接中',
  closed: '已断开',
} as const;
