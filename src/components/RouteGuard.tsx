'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from "lucide-react";
import { getUser } from '@/lib/authUtils';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 跳过管理员路由和认证页面
    if (pathname?.startsWith('/admin') || pathname === '/auth') {
      setLoading(false);
      return;
    }

    // 检查用户是否登录
    const user = getUser();
    if (!user) {
      router.push('/auth');
    } else {
      setLoading(false);
      // 触发一个事件通知认证状态已更新
      window.dispatchEvent(new Event('auth-change'));
    }
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
} 