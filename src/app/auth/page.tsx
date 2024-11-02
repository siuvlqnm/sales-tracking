'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { authenticateUser } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await authenticateUser(trackingId);
      // 设置 cookie 时添加更多选项
      document.cookie = `user=${JSON.stringify(user)}; path=/; max-age=86400; samesite=lax`;
      
      toast({
        title: "验证成功",
        description: "正在跳转...",
      });

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