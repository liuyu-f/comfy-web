// src/components/connection-test.tsx
import { useComfyStore } from '@/store/use-comfy-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, User } from 'lucide-react';


export function ConnectionTest() {
  const wsStatus = useComfyStore((state) => state.wsStatus);
  const userName = useComfyStore((state) => state.username);

  return (
    <Card className="w-80 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>工作站概览</span>
          {/* 使用 text-primary 和 text-muted-foreground 实现图标颜色动态切换 */}
          {wsStatus === 'open' ? (
            <Wifi className="text-primary animate-pulse" size={16} />
          ) : (
            <WifiOff className="text-muted-foreground" size={16} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 用户信息展示 */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted">
            <User size={16} className="text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold">{userName}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              ID: {userName}
            </span>
          </div>
        </div>

        {/* 状态标签 */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Socket Status
          </span>
          <Badge variant={wsStatus === 'open' ? "default" : "secondary"} className="text-[10px]">
            {wsStatus.toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}