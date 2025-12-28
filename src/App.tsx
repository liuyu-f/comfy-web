// src/App.tsx
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { ConnectionTest } from "@/components/connection-test"
import { useComfyStore } from "@/store/use-comfy-store" // 引入仓库
import { UserAuth } from "@/components/user-auth"
import { Button } from '@/components/ui/button';



export default function App() {
  const username = useComfyStore(state => state.username);
  const connect = useComfyStore(state => state.connect);
  const logout = useComfyStore(state => state.logout);
  const [isVerifying, setIsVerifying] = useState(!!username);

  // 如果本地存过用户名，直接自动重连
  useEffect(() => {
    const verifyAndConnect = async () => {
      if (username) {
        try {
          // 问一下服务器，这个名字还活着吗？
          const res = await fetch(`/api/check-user/${username}`);
          if (res.ok) {
            connect(username); // 只有服务器说 OK，我们才连
          } else {
            logout(); // 服务器说查无此人，直接强制踢出
          }
        } catch (e) {
          console.error("网络错误，无法验证用户");
        }
      }
      setIsVerifying(false);
    };

    verifyAndConnect();
  }, []); // 仅在应用首次加载时运行

  // 如果正在校验中，显示一个简单的加载状态，防止界面闪烁
  if (isVerifying) return <div className="flex items-center justify-center h-screen">正在验证身份...</div>;

  return (
    <ThemeProvider defaultTheme="dark" storageKey="comfy-ui-theme">
      <main className="flex items-center justify-center min-h-screen">
        {username ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">欢迎回来, {username}</h1>
            <ConnectionTest />
            <Button size="sm" onClick={logout}>退出登录</Button>
          </div>
        ) : (
          <UserAuth />
        )}
      </main>
    </ThemeProvider>
  );
}

//export default function App() {
//  // 从仓库中提取 connect 方法
//  const connect = useComfyStore((state) => state.connect);
//
//  // 应用挂载时执行一次自动连接
//  useEffect(() => {
//    connect();
//  }, [connect]);
//
//  return (
//    <ThemeProvider defaultTheme="dark" storageKey="comfy-ui-theme">
//      {/* 总框架 */}
//      <div className="min-h-screen bg-background text-foreground transition-colors duration-300"> 
//        <header className="border-b bg-card/50">
//          <div className="container mx-auto flex h-16 items-center justify-between px-4">
//            <h2 className="text-lg font-bold tracking-tight">ComfyUI Console</h2>
//            <ModeToggle />
//          </div>
//        </header>
//
//        <main className="container mx-auto p-8 flex flex-col items-center gap-8">
//          <ConnectionTest />
//        </main>
//      </div>
//    </ThemeProvider>
//  )
//}