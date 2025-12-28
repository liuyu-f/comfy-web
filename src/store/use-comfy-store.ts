// src/store/use-comfy-store.ts
import { create } from 'zustand';
import { comfyApi } from '@/lib/comfy-api';

// 1. 必须在接口里声明 logout 及其类型
interface ComfyState {
  username: string | null;
  wsStatus: 'closed' | 'connecting' | 'open';
  socket: WebSocket | null;
  connect: (username: string) => void;
  disconnect: () => void;
  logout: () => void; // <--- 必须有这一行！
}

export const useComfyStore = create<ComfyState>((set, get) => ({
  username: localStorage.getItem('comfy-username'),
  wsStatus: 'closed',
  socket: null,

  connect: (username: string) => {
    const { socket } = get();
    if (socket) return; 

    const ws = comfyApi.createWebSocket(username);
    ws.onopen = () => set({ wsStatus: 'open' });
    ws.onclose = () => set({ wsStatus: 'closed', socket: null });
    
    // 登录成功时，同时更新内存和浏览器存储
    localStorage.setItem('comfy-username', username);
    set({ username, socket: ws, wsStatus: 'connecting' });
  },

  disconnect: () => {
    get().socket?.close();
    set({ socket: null, wsStatus: 'closed' });
  },

  // 2. 在这里实现具体逻辑
  logout: () => {
    get().socket?.close(); // 关闭连接
    localStorage.removeItem('comfy-username'); // 关键：删掉浏览器持久化数据
    set({ username: null, socket: null, wsStatus: 'closed' }); // 清空状态
  }
}));