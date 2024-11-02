'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from "lucide-react"; // 如果你使用 lucide-react 图标

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
    const getCookieUser = () => {
      const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user='));
      return userCookie ? JSON.parse(userCookie.split('=')[1]) : null;
    };

    const user = getCookieUser();
    if (!user) {
      router.push('/auth');
    } else {
      setLoading(false);
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