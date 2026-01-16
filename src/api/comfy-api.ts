// src/api/comfy-api.ts
// 调用Comfy API - 服务层

// 定义基础路径，匹配 vite.config.ts 里的代理配置
const API_BASE = '/api-comfy'; // 调用Comfy API的标准前缀，标准化
const VIEW_BASE = `${API_BASE}/view`; // 查看图片
const WS_PATH = `${API_BASE}/ws`; // ws

/**
 * ComfyUI后端对 系统状态 接口的定义
 * @param system 系统信息
 */ 
export interface SystemStats {
  system: { os: string; python_version: string; embedded_python?: boolean };
  devices: {
  name: string;      // 显卡名称，例如 "NVIDIA GeForce RTX 4090"
  type: string;      // 设备类型，例如 "cuda" 或 "cpu"
  index: number;     // 设备编号，0, 1, 2...
  vram_total: number; // 总显存 (字节)
  vram_free: number;  // 空闲显存 (字节) 
  }[]; // []代表是数组，调用信息时输入0来表示调用第一个设备(一般是显卡)的信息
}

// 生图任务提交后的返回结构
export interface PromptQueueResponse {
  prompt_id: string;
  number: number;
  node_errors: any;
}

// 图片上传后的返回结构
export interface ImageUploadResponse {
  name: string;
  subfolder: string;
  type: string;
}

// 定义事件映射表，让事件数据类型安全
export interface ComfyEventMap {
  'status': { queueRemaining: number }; // 系統狀態
  'progress': { value: number; max: number }; // 進度
  'executing': string; // 节点 ID
  'execution_start': { prompt_id: string };  // 任务开始 (包含 prompt_id)
  'execution_success': any; // 成功
  'execution_error': any; // 失败
  'disconnected': undefined; // 被动断开
  'b_preview': ArrayBuffer; // 二进制预览图
}

// 定義事件類型，讓外部使用時有類型提示
type ComfyEventType = keyof ComfyEventMap;

/**
 * ComfyApiService 类
 *
 * 这是一个“管家”类，专门负责跟 ComfyUI 后端打交道。
 * 它把所有复杂的网络请求、连接管理都藏在内部，只对外暴露简单好用的方法。
 */
export class ComfyApiService extends EventTarget {
  // 就像你打电话，得先把听筒（ws对象）拿在手里，才能说话。
  // 初始化为 null，表示还没开始打电话。
  private ws: WebSocket | null = null; //  WebSocket 实例，用于和 ComfyUI 后端进行双向通信
  private clientId: string | null = null; //  客户端 ID，用于标识当前连接，与 ComfyUI 后端进行会话绑定

  /**
   * 注册事件监听
   * 使用 EventTarget 后，我们需要封装一下 CustomEvent 的细节
   * @param event 事件名称，必须是 ComfyEventMap 中定义的 key
   * @param callback 事件处理函数，接收 ComfyEventMap 中对应事件的数据类型
   * @param options 监听器选项，例如 { once: true }
   * @returns this，用于链式调用
   */
  on<K extends ComfyEventType>(event: K, callback: (data: ComfyEventMap[K]) => void, options?: AddEventListenerOptions) {
    this.addEventListener(event, (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail);
    }, options);
    return this;
  }

  /**
   * 内部触发事件辅助方法
   * @param event 事件名称，必须是 ComfyEventMap 中定义的 key
   * @param data 事件数据，类型必须符合 ComfyEventMap 中对应事件的定义
   */
  private emit<K extends ComfyEventType>(event: K, data?: ComfyEventMap[K]) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  /**
   * 建立 WebSocket 连接 (核心方法)
   * @param clientId 你的身份证号（客户端ID），ComfyUI 需要知道是谁连上来了
   * @returns Promise<WebSocket>，当连接成功建立时 resolve，连接失败时 reject
   */
  connect(clientId: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => { //  创建一个 Promise，用于处理异步连接操作
      this.clientId = clientId; //  保存客户端 ID，用于后续请求
      if (this.ws) { //  如果已经存在 WebSocket 连接
        this.disconnect(); //  先断开之前的连接
      }

      // 自动判断是普通连接 (ws) 还是加密连接 (wss)，跟你的网页协议保持一致
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;

      // 终于开始拨号了！创建 WebSocket 实例
      const url = `${protocol}//${host}${WS_PATH}?clientId=${clientId}`; //  拼接 WebSocket 连接 URL
      console.log(`[ComfyApi]-ws 正在连接到: ${url}`);
      this.ws = new WebSocket(url); //  创建 WebSocket 实例

      // 【关键点】告诉 WebSocket：“如果有二进制数据（比如图片），请用 ArrayBuffer 格式给我”
      // 如果不设这个，图片数据可能会变成乱码字符串，那就没法显示了。
      this.ws.binaryType = "arraybuffer"; //  设置接收二进制数据的格式为 ArrayBuffer

      // 监听：电话通了吗？
      this.ws.onopen = () => { //  当 WebSocket 连接成功建立时
        console.log('[ComfyApi]-ws 连接建立完毕');
        if (this.ws) resolve(this.ws); //  将 WebSocket 实例传递给 Promise 的 resolve 函数
      };

      this.ws.onclose = () => {
        // 當 WebSocket 被動斷開時，通知外部
        this.emit('disconnected');
      };

      // 监听：拨号失败了吗？
      this.ws.onerror = (err) => { //  当 WebSocket 连接发生错误时
        console.error('[ComfyApi]-ws 连接发生错误:', err);
        reject(err); //  将错误信息传递给 Promise 的 reject 函数
      };

      // 我们在这里挂载一个内部的消息处理函数 handleMessage
      // 这样无论外部怎么用，我们内部都能先看一眼消息（比如打印日志，或者处理预览图）
      this.ws.addEventListener('message', (event) => { //  监听 WebSocket 接收到的消息
        this.handleMessage(event); //  调用内部消息处理函数
      });
    });
  }

  /**
   * 内部消息处理函数
   * 就像一个分拣员，把收到的包裹分成“普通信件（JSON）”和“包裹（二进制图片）”
   * 未来可以扩展逻辑，将图片或者json数据返回
   * @param event WebSocket 接收到的消息事件
   */
  private handleMessage(event: MessageEvent) {
    if (event.data instanceof ArrayBuffer) { //  如果接收到的数据是 ArrayBuffer 类型的
      // 1. 如果是 ArrayBuffer，说明收到的是二进制数据（通常是生图过程中的预览图）
      // console.log("[ComfyApi]-ws 收到二进制预览图数据，大小:", event.data.byteLength);
      // 将二进制数据派发出去，UI 层可以将其转换为 Blob Url 进行展示
      this.emit('b_preview', event.data); //  触发 'b_preview' 事件，传递二进制数据
    } else {
      // 2. 否则通常是字符串，尝试当做 JSON 解析
      try {
        // 这里的 msg 包含了当前的进度、当前运行到哪个节点等信息
        const msg = JSON.parse(event.data as string); //  将接收到的字符串数据解析为 JSON 对象

        // 【核心邏輯轉移】在這裡解析協議，並分發給訂閱者
        switch (msg.type) { //  根据消息类型进行不同的处理
          case 'status': // 系統狀態
            // 数据清洗：只提取 UI 关心的 queueRemaining，屏蔽后端结构差异
            // 如果未来后端字段变了，只需要改这里，Store 不用动
            this.emit('status', { queueRemaining: msg.data?.status?.exec_info?.queue_remaining ?? 0 }); //  触发 'status' 事件，传递队列剩余任务数
            break;
          case 'progress': // 進度
            // 数据清洗：确保吐出的数据结构是 { value, max }
            this.emit('progress', { value: msg.data?.value, max: msg.data?.max }); //  触发 'progress' 事件，传递进度信息
            break;
          case 'executing': // 正在執行的節點
            this.emit('executing', msg.data.node); //  触发 'executing' 事件，传递当前正在执行的节点 ID
            break;
          case 'execution_start': // 任务开始 (包含 prompt_id)
            this.emit('execution_start', msg.data); //  触发 'execution_start' 事件，传递任务 ID
            break;
          case 'execution_success': // 成功
          case 'execution_error': // 失敗
            this.emit(msg.type, msg.data); //  触发 'execution_success' 或 'execution_error' 事件，传递任务结果
            break;
        }
      } catch (e) { //  如果解析 JSON 失败
        console.error("[ComfyApi]-ws 解析消息失败:", e);
      }
    }
  }

  /**
   * 断开连接
   *
   * 非常重要！组件卸载时一定要调用。
   * 就像离开房间要关灯一样，防止资源浪费。
   */
  disconnect() {
    if (this.ws) { //  如果 WebSocket 连接存在
      // 把之前的监听器都清空，防止断开后还触发奇怪的回调
      this.ws.onclose = null;
      this.ws.onerror = null;
      // 正式关闭连接
      this.ws.close(); //  关闭 WebSocket 连接
      this.ws = null; //  将 WebSocket 实例设置为 null
      this.clientId = null; //  清除客户端 ID

      // 注意：EventTarget 没有 removeAllListeners。
      // 由于 use-comfy-store 每次 connect 都会重新绑定事件，
      // 这里的“清理”工作实际上依赖于 Store 自身的逻辑或页面刷新。
      // 如果是单页应用且频繁重连，建议 Store 层保存 listener 引用并在 disconnect 时 removeEventListener。
      // 但为了保持当前代码简单，且 EventTarget 监听器开销较小，这里暂不处理。
      console.log("[ComfyApi]-ws 已断开");
    }
  }

  // --- 下面是之前的 HTTP 方法，我把它们搬进了类里面，用法基本不变 ---

  // 2. 获取系统状态 (HTTP GET)
  async getSystemStats(): Promise<SystemStats> {
    // fetch时网络请求就发出，等待服务器返回“状态码”和“头信息”
    const res = await fetch(`${API_BASE}/system_stats`); //  发送 GET 请求到 /system_stats 接口
    // 此时 Body 可能还没下载完，但我们已经知道状态码了
    // res.ok 等价于 (res.status >= 200 && res.status < 300)
    if (!res.ok) throw new Error('获取系统信息失败'); //  如果状态码不是 2xx，则抛出错误
    return res.json(); //  将响应体解析为 JSON 对象
  }

  // 3. 提交生图任务 (HTTP POST)
  // [优化] clientId 变为可选参数。如果不传，默认使用当前连接的 ID
  async queuePrompt(workflowJson: any, clientId?: string): Promise<PromptQueueResponse> {
    const targetClientId = clientId || this.clientId;
    if (!targetClientId) throw new Error('未连接且未提供 clientId，无法提交任务');

    const res = await fetch(`${API_BASE}/prompt`, { //  发送 POST 请求到 /prompt 接口
      method: 'POST',  // 指定 HTTP 的请求方法为“提交（POST）”。获取数据使用 GET并不存在请求体，或者删除自定义请求的代码段，默认即 GET，比如 `getSystemStats`
      headers: { 'Content-Type': 'application/json' }, // 这是“请求头”，就像在快递盒上贴的标签。告诉服务器 用 JSON 格式解析包裹。
      body: JSON.stringify({ // 将JSON序列化为字符串最为请求体发送后端
        prompt: workflowJson,
        client_id: targetClientId
      })
    });
    if (!res.ok) throw new Error('生图任务排队失败'); //  如果状态码不是 2xx，则抛出错误
    return res.json(); // 返回包含 prompt_id 的对象
  }

  // 4. 中断生成 (HTTP POST)
  async interrupt() {
    const res = await fetch(`${API_BASE}/interrupt`, { //  发送 POST 请求到 /interrupt 接口
      method: 'POST',
    });
    if (!res.ok) throw new Error('中断执行失败'); //  如果状态码不是 2xx，则抛出错误
  }

  // 5. 清空队列 (HTTP POST)
  async clearQueue() {
    const res = await fetch(`${API_BASE}/queue`, { //  发送 POST 请求到 /queue 接口
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clear: true })
    });
    if (!res.ok) throw new Error('清空队列失败'); //  如果状态码不是 2xx，则抛出错误
  }

  // 6. 上传图片 (HTTP POST)
  async uploadImage(file: File, type = 'input', overwrite = false): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    formData.append('overwrite', String(overwrite).toLowerCase());

    const res = await fetch(`${API_BASE}/upload/image`, { //  发送 POST 请求到 /upload/image 接口
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('图片上传失败'); //  如果状态码不是 2xx，则抛出错误
    return res.json(); // 返回 { name, subfolder, type }
  }

  // 7. 获取图片 URL (辅助函数)
  // 供 <img> 标签使用：<img src={comfyApi.getImageUrl('test.png')} />
  getImageUrl(filename: string, subfolder = '', type = 'output') {
    const params = new URLSearchParams({ filename, subfolder, type });
    return `${VIEW_BASE}?${params.toString()}`;
  }
}

// 导出这个类的一个实例（单例模式）
// 这样你在其他文件里 import { comfyApi } from ... 时，拿到的直接就是这个“管家”对象
// 不用自己再去 new ComfyApiService() 了，非常方便。
export const comfyApi = new ComfyApiService();
