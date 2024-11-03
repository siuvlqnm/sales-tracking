'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getUser } from '@/lib/authUtils';
import { Loader2 } from "lucide-react";

const publicPaths = ['/auth'];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    const path = pathname.split('?')[0];

    if (!user && !publicPaths.includes(path)) {
      router.push('/auth');
    } else {
      setAuthorized(true);
    }
    setLoading(false);
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!authorized && !publicPaths.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
} 