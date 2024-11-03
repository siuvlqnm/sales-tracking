'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getUser } from '@/lib/authUtils';
import { Loader2 } from "lucide-react";

const publicPaths = ['/auth'];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  const authCheck = useCallback((url: string) => {
    const user = getUser();
    const path = url.split('?')[0];

    if (!user && !publicPaths.includes(path)) {
      setAuthorized(false);
      router.push('/auth');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  useEffect(() => {
    authCheck(pathname);
  }, [pathname, authCheck]);

  if (!authorized && !publicPaths.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
} 