'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { authenticateUser } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { setAuth } from '@/lib/authUtils';

export default function AuthPage() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { token } = await authenticateUser(trackingId);
      
      // 只需要保存 token，用户信息已包含在 token 中
      setAuth(token);
      
      toast({
        title: "验证成功",
        description: "正在跳转...",
      });

      // 触发认证状态更新
      window.dispatchEvent(new Event('auth-change'));
      router.push('/');
    } catch (error) {
      toast({
        title: "验证失败",
        description: error instanceof Error ? error.message : "请检查您的 Tracking ID",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">验证访问权限</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="请输入 Tracking ID"
              disabled={loading}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || !trackingId}
            >
              {loading ? '验证中...' : '验证'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 