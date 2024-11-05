'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";

const publicPaths = ['/auth'];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const path = pathname.split('?')[0];
  if (!user && !publicPaths.includes(path)) {
    router.push('/auth');
    return null;
  }

  return <>{children}</>;
} 