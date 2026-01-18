// src/pages/HomePage.tsx
// 主页组件

import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComfyStatus, useComfyActions } from '@/hooks/useComfy';
import { MESSAGES, STATUS_LABELS } from '@/constants';

export default function HomePage() {
  const username = "user1"; // 临时定义，后续将添加登录页
  const { wsStatus, lastError } = useComfyStatus();
  const { connect, disconnect, clearError } = useComfyActions();

  const handleConnect = async () => {
    clearError();
    await connect(username);
  };

  const handleDisconnect = () => {
    clearError();
    disconnect();
  };

  const getStatusColor = () => {
    switch (wsStatus) {
      case 'open':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'closed':
        return 'bg-red-500';
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* 导航栏 */}
        <div className="h-12 flex-none flex flex-row justify-between items-center px-6 gap-6 border-b">
          <h2 className="flex-none hidden sm:block text-lg font-bold tracking-tight">
            ComfyUI Console
          </h2>

          {/* 连接状态指示器 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-sm text-muted-foreground">
                {STATUS_LABELS[wsStatus]}
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {wsStatus === 'open' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
              >
                {MESSAGES.DISCONNECT}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleConnect}
                disabled={wsStatus === 'connecting'}
              >
                {wsStatus === 'connecting' ? MESSAGES.CONNECTING : MESSAGES.CONNECT}
              </Button>
            )}

            <ModeToggle />
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
          {/* 错误提示 */}
          {lastError && (
            <div className="max-w-md w-full bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">
                    {MESSAGES.ERROR_TITLE}
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {lastError}
                  </p>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 页面状态 */}
          <div className="space-y-4 text-center">
            {wsStatus === 'open' && (
              <div className="space-y-2">
                <Badge variant="default" className="bg-green-500">
                  {MESSAGES.CONNECTED}
                </Badge>
                <p className="text-muted-foreground">
                  现在可以开始配置流程和生成图像
                </p>
              </div>
            )}

            {wsStatus === 'closed' && (
              <div className="space-y-2">
                <Badge variant="secondary">
                  {MESSAGES.NOT_CONNECTED}
                </Badge>
                <p className="text-muted-foreground">
                  请点击上方"连接"按钮连接到 ComfyUI
                </p>
              </div>
            )}

            {wsStatus === 'connecting' && (
              <div className="space-y-2">
                <Badge variant="outline">
                  {MESSAGES.CONNECTING}
                </Badge>
                <p className="text-muted-foreground">
                  正在建立连接
                </p>
              </div>
            )}
          </div>

          {/* 待施工区域 */}
          <div className="mt-8 p-6 bg-muted rounded-lg border border-muted-foreground/20">
            <p className="text-muted-foreground text-sm">
              🚧 更多功能正在开发中...
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
