// src/lib/user-config.ts
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'comfy_user_config';

// 定义配置文件的结构
interface UserConfig {
  clientId: string;
  userName: string;
  lastUsed: number;
}

export const userConfig = {
  // 获取配置（如果不存在则初始化）
  get: (): UserConfig => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // 初始化一份默认配置
    const newConfig: UserConfig = {
      clientId: uuidv4(), // 生成后永久保存，除非清除缓存
      userName: '匿名画师',
      lastUsed: Date.now(),
    };
    userConfig.save(newConfig);
    return newConfig;
  },

  // 保存配置
  save: (config: UserConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  },

  // 更新单个字段
  update: (patch: Partial<UserConfig>) => {
    const current = userConfig.get();
    userConfig.save({ ...current, ...patch });
  }
};