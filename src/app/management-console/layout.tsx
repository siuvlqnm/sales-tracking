"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { verifyAdminToken } from '@/lib/adminApi';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 如果是登录页面，不需要验证
        if (pathname === '/management-console/login') {
          setIsLoading(false);
          return;
        }

        const isValid = await verifyAdminToken();
        setIsAuthenticated(isValid);

        if (!isValid) {
          router.push('/management-console/login');
        }
      } catch (error) {
        console.error('验证失败:', error);
        router.push('/management-console/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 登录页面不显示导航栏
  if (pathname === '/management-console/login') {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // 已认证的用户显示导航栏
  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && <AdminNav />}
      {children}
    </div>
  );
} 