// src/pages/HomePage.tsx
import { ModeToggle } from "@/components/mode-toggle" // 黑暗模式切换
import { useComfyStore } from "@/store/use-comfy-store" // 引入仓库
import { Button } from '@/components/ui/button'; // 引入按钮

export default function HomePage() {
  // const username = useComfyStore(state => state.username);
  const username = "user1"; // 临时定义，测试用

  // 【Selector 模式】
  // 写法：useComfyStore(state => state.connect)
  // 含义：从整个 Store 中“挑选”出 connect 这个函数。
  // 优势：只有当 connect 发生变化时（通常不会变），组件才会重渲染。如果直接 const store = useComfyStore()，那么 store 里任何属性（如 queueRemaining）变化都会导致 App 组件重渲染，性能较差。
  const connect = useComfyStore(state => state.connect);
  const logout = useComfyStore(state => state.logout);

  return (
    <>
      {/* 框架。flex：弹性框架。flex-row/col：将flex内项目水平/垂直定位 */}
      {/* 对齐：justify-center(沿主轴居中)，items-center(沿交叉轴居中) */}
      <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
        
        {/* 导航栏 */}
        <div className="h-[3rem] flex-none flex flex-row justify-end items-center px-[1.5rem] gap-[1.5rem] border-b">
          {/* flex盒子内元素比例：flex-none(不拉伸) flex-1(按填写比例拉伸) flex-initial(根据初始尺寸缩小) flex-auto(根据初始尺寸伸缩)*/}
          {/* grow-0(禁止生长) grow(自动生长并填满空间) grow-3(按填写比例生长) */}
          <h2 className="flex-none hidden sm:block text-lg font-bold tracking-tight">ComfyUI Console</h2>
          <div  className="grow"></div> {/* invisible:隐藏内容但保留布局影响 */}
          <Button variant="outline" size="sm" onClick={() => connect(username)}>连接测试</Button>
          <Button variant="outline" size="sm" onClick={logout}>退出</Button>
          <div className="flex-none"><ModeToggle /></div>
        </div>

        {/* 导航栏外 */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8"> {/* gap:组件之间的距离 */}
          <div className="space-y-4">
            {/* 待施工... */}
          </div>
        </div>
      </div>
    </>
  );
}
