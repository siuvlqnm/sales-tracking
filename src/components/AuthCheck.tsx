"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/authUtils';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  useEffect(() => {
    if (!getUser()) {
      router.push('/auth');
    }
  }, [router]);

  return <>{children}</>;
} 