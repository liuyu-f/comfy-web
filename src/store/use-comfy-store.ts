// src\store\use-comfy-store.ts
// 调用Comfy API - 状态层
/**
 * Zustand 状态仓库
 * 作用：管理全局的 WebSocket 连接、用户信息和连接状态
 * 引入理由：Zustand 比原生 Context 性能更好，且逻辑与 UI 完全解耦
 */
import { create } from "zustand";
import { comfyApi } from "@/api/comfy-api";

// 这里就像是我们在定义一个“数据模型”，告诉 TypeScript 这个仓库里会有哪些数据，以及哪些方法。
interface ComfyState {
  // --- 状态数据 (State) ---
  username: string | null; // 当前登录的用户名，没登录就是 null
  wsStatus: "closed" | "connecting" | "open"; // WebSocket 的连接状态：关闭、连接中、已连接
  queueRemaining: number; // 队列中剩余的任务数
  progress: { value: number; max: number } | null; // 当前任务进度
  executingNodeId: string | null; // 当前正在执行的节点 ID
  currentPromptId: string | null; // 当前正在执行的任务 ID
  previewBlobUrl: string | null; // 实时预览图的 URL (Blob)
  listenerController: AbortController | null; // 用于管理事件监听的控制器

  // --- 动作方法 (Actions) ---
  // 这里的函数签名定义了我们可以在组件里调用的操作
  connect: (username: string) => Promise<void>; // 发起连接，因为涉及网络请求，所以是 Promise
  disconnect: () => void; // 断开连接
  interrupt: () => Promise<void>; // 中断生成
  clearQueue: () => Promise<void>; // 清空队列
  logout: () => void; // 退出登录（断开 + 清除数据）
}

// 创建 Store
// create<ComfyState> 里的泛型 <ComfyState> 是为了让 TS 帮我们检查代码有没有写错
// create 函数执行后返回的 `useComfyStore` 是一个自定义 Hook，供组件调用
export const useComfyStore = create<ComfyState>((set, get) => ({
  // 1. 初始化状态
  // 尝试从浏览器本地存储 (localStorage) 读取上次存的用户名，这样刷新页面后用户还在
  username: localStorage.getItem("comfy-username"),
  wsStatus: "closed", // 默认状态是关闭的
  queueRemaining: 0,
  progress: null,
  executingNodeId: null,
  currentPromptId: null,
  previewBlobUrl: null,
  listenerController: null,

  // 2. 定义 connect 动作
  // 这是一个异步函数，因为它需要等待网络连接建立
  connect: async (username: string) => {
    // get() 方法可以获取当前仓库里所有对象的最新状态
    // 在异步操作中，使用 get() 能确保我们拿到的是执行那一刻的最新值，而不是闭包里的旧值
    const { wsStatus } = get(); // 由于接下来多次使用wsStatus，所以提升为常量，可以减少对全局状态的多次读写

    // 【防抖保护】如果当前已经是“连接中”或者“已连接”，就不要重复发起连接了，防止用户狂点按钮
    if (wsStatus === "open" || wsStatus === "connecting") return;

    // 立即更新状态为 "connecting"，这样 UI 上可以让图标转圈圈，给用户反馈
    // set() 用于更新状态，它会自动“合并”新数据到 Store 中（类似 React 的 setState）
    set({ wsStatus: "connecting" });

    try {
      // 调用我们在 comfy-api.ts 里写的服务层方法
      // await 表示：在这里暂停一下，直到连接成功（或者失败报错）再往下走
      await comfyApi.connect(username);

      // 如果在等待连接的过程中，disconnect 已经被调用（比如 React StrictMode 触发了卸载），
      // 此时 wsStatus 已经被改为 "closed"。我们需要拦截，防止错误的将状态重置为 "open"。
      // 注意：由於現在 disconnect 會清空 listeners，下面的事件綁定不會生效，所以這裡的邏輯可以簡化，
      // 但為了保險起見，保留狀態檢查是好的。
      if (get().wsStatus === "closed") return;

      // 右侧的username是外部调用connect获得的参数。
      set({ wsStatus: "open", username: username });

      // 把用户名存到浏览器里，下次来还能记得
      localStorage.setItem("comfy-username", username);

      // 【标准做法：使用 AbortController 管理监听器】
      // 1. 如果有旧的控制器（说明有残留监听器），先中止它
      if (get().listenerController) {
        get().listenerController?.abort();
      }
      
      // 2. 创建新的控制器
      const controller = new AbortController();
      set({ listenerController: controller });
      const signal = { signal: controller.signal };

       // 1. 監聽被動斷開
      comfyApi.on('disconnected', () => {
        // 再次检查当前状态，避免不必要的更新（比如是我们自己主动断开的）
        if (get().wsStatus !== "closed") {
          console.log("检测到 WebSocket 被动断开");
          set({ wsStatus: "closed" });
        }
      }, signal);

      // 2. 監聽業務消息
      comfyApi.on('status', ({ queueRemaining }) => {
        set({ queueRemaining });
      }, signal);
      
      comfyApi.on('progress', (progress) => {
        set({ progress });
      }, signal);
      
      comfyApi.on('executing', (nodeId) => {
        set({ executingNodeId: nodeId });
      }, signal);

      // 监听任务开始
      comfyApi.on('execution_start', (data) => {
        set({ currentPromptId: data.prompt_id });
      }, signal);

      // 监听实时预览图 (二进制数据)
      comfyApi.on('b_preview', (blobData: ArrayBuffer) => {
        // 1. 释放旧的 URL，防止内存泄漏
        const oldUrl = get().previewBlobUrl;
        if (oldUrl) URL.revokeObjectURL(oldUrl);

        // 2. 创建新的 Blob URL
        const blob = new Blob([blobData], { type: 'image/jpeg' });
        const newUrl = URL.createObjectURL(blob);
        set({ previewBlobUrl: newUrl });
      }, signal);
      
      const handleFinished = () => set({ progress: null, executingNodeId: null, currentPromptId: null });
      comfyApi.on('execution_success', handleFinished, signal);
      comfyApi.on('execution_error', handleFinished, signal);

    } catch (error) {
      // 如果 try 里面的代码报错了（比如连不上服务器），就会跳到这里
      console.error("连接失败:", error);
      // 记得把状态改回 closed，让用户可以再次尝试点击连接
      set({ wsStatus: "closed" });
    }
      // 实际项目中，这里可以调用一个 toast 函数弹窗提示用户
  },

  // 3. 定义 disconnect 动作 (主动断开)
  disconnect: () => {
    // 调用服务层真正断开连接
    comfyApi.disconnect();
    
    // 【清理监听器】
    // 调用 abort()，所有绑定了该 signal 的监听器会被浏览器自动移除
    get().listenerController?.abort();

    // 清理预览图资源
    const { previewBlobUrl } = get();
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);

    // 更新 UI 状态
    set({ wsStatus: "closed", previewBlobUrl: null, listenerController: null });
  },

  // 4. 定义 interrupt 动作，中断生成
  interrupt: async () => {
    try {
      await comfyApi.interrupt();
    } catch (error) {
      console.error("中断执行失败:", error);
    }
  },


  // 5. 定义 clearQueue 动作，清空队列
  clearQueue: async () => {
    try {
      await comfyApi.clearQueue();
      set({ queueRemaining: 0 }); // 乐观更新：假设清空成功，立即重置 UI 计数
    } catch (error) {
      console.error("清空队列失败:", error);
    }
  },

  // 6. 定义 logout 动作 (退出登录)
  logout: () => {
    // 先断开连接
    get().disconnect(); // 复用 disconnect 的清理逻辑
    // 清除本地存储的用户名
    localStorage.removeItem("comfy-username");
    // 重置 store 里的状态
    set({ username: null, wsStatus: "closed", queueRemaining: 0, progress: null, executingNodeId: null, currentPromptId: null, previewBlobUrl: null, listenerController: null });
  },
}));
