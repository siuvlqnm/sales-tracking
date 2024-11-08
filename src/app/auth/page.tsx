'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authenticateUser } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { setAuth, clearAuth, getUser } from '@/lib/authUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [formState, setFormState] = useState({
    trackingId: '',
    loading: false,
    error: ''
  });
  const router = useRouter();
  const { refreshUser, user } = useAuth();

  if (user) {
    router.replace('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFormState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await authenticateUser(formState.trackingId);
      
      if (!response?.token) {
        throw new Error('登录失败：无效的凭证');
      }

      await setAuth(response.token);
      await refreshUser();
      
      const currentUser = await getUser();
      if (!currentUser) {
        throw new Error('登录失败：无法获取用户信息');
      }

      setTimeout(() => {
        router.replace('/');
      }, 100);
      
    } catch (err: unknown) {
      console.error('Authentication error:', err);
      clearAuth();
      setFormState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : '登录失败，请重试'
      }));
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormState(prev => ({
      ...prev,
      trackingId: value,
      error: ''
    }));
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-gray-100 p-4 sm:p-6">
      <Card className="w-full max-w-md mx-auto mt-[20vh] sm:mt-0">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl text-center">验证访问权限</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Input
                value={formState.trackingId}
                onChange={handleInputChange}
                placeholder="请输入令牌 ID"
                disabled={formState.loading}
                autoFocus
                aria-label="令牌 ID"
                className="h-12 sm:h-10 text-base px-4"
              />
              {formState.error && (
                <div className="text-red-500 text-sm px-1" role="alert">
                  {formState.error}
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 sm:h-10 text-base"
              disabled={formState.loading || !formState.trackingId.trim()}
            >
              {formState.loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  验证中...
                </>
              ) : (
                '验证'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 