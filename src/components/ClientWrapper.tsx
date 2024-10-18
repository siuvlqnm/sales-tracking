"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { setUserFromParams, getUser, refreshUserExpiration } from '@/lib/userManager';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 这里放置您的 useEffect 逻辑
  }, [searchParams]);

  return <>{children}</>;
}
