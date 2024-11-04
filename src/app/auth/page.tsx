'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authenticateUser } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { setAuth } from '@/lib/authUtils';

export default function AuthPage() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authenticateUser(trackingId);
      
      if (response?.token) {
        await setAuth(response.token);
        router.push('/');
      } else {
        setError('登录失败：无效的凭证');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err?.message || '登录失败，请重试');
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
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
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