/**
 * 全局类型定义
 */

/**
 * ComfyUI 系统信息
 */
export interface SystemStats {
  system: {
    os: string;
    python_version: string;
    embedded_python?: boolean;
  };
  devices: Array<{
    name: string;
    type: string;
    index: number;
    vram_total: number;
    vram_free: number;
  }>;
}

/**
 * 提示词排队响应
 */
export interface PromptQueueResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, any>;
}

/**
 * 图片上传响应
 */
export interface ImageUploadResponse {
  name: string;
  subfolder: string;
  type: string;
}

/**
 * WebSocket 事件映射
 */
export interface ComfyEventMap {
  'status': { queueRemaining: number };
  'progress': { value: number; max: number };
  'executing': string;
  'execution_start': { prompt_id: string };
  'execution_success': Record<string, any>;
  'execution_error': Record<string, any>;
  'disconnected': undefined;
  'b_preview': ArrayBuffer;
}

/**
 * 连接状态
 */
export type ConnectionStatus = 'closed' | 'connecting' | 'open';

/**
 * ComfyUI 工作流提示词模板
 */
export interface WorkflowPrompt {
  [nodeId: string]: {
    inputs: Record<string, any>;
    class_type: string;
    _meta?: {
      title?: string;
    };
  };
}

/**
 * 流程信息
 */
export interface WorkflowInfo {
  id: string;
  name: string;
  description: string;
  prompt: WorkflowPrompt;
  createdAt: number;
  updatedAt: number;
}

/**
 * 预设信息
 */
export interface PresetInfo {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

/**
 * 应用错误类型
 */
export class AppError extends Error {
  public code: string;
  public details?: Record<string, any>;

  constructor(code: string, message: string, details?: Record<string, any>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * API 错误响应
 */
export interface ApiErrorResponse {
  error: string;
  details?: Record<string, any>;
}
