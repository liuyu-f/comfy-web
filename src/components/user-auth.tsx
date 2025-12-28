// src/components/user-auth.tsx
import { useState } from 'react';
import { useComfyStore } from '@/store/use-comfy-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export function UserAuth() {
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');
  const connect = useComfyStore(state => state.connect);

  const handleRegister = async () => {
    if (!nameInput.trim()) return;

    try {
      // 向我们刚才写的 Node.js 后端发请求
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: nameInput })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '注册失败');

      // 注册成功，执行 ComfyUI 连接
      connect(nameInput);
      setError('');
    } catch (err: any) {
      // 如果是因为没开服务器，这里会提示 "Failed to fetch"
      // 如果是用户名重复，这里会提示 "用户名已存在"
      setError(err.message);
      console.error("注册请求详情:", err);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>用户注册</CardTitle>
        <CardDescription>输入用户名以启动 ComfyUI 工作站</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          placeholder="输入用户名..." 
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full" onClick={handleRegister}>进入系统</Button>
      </CardContent>
    </Card>
  );
}