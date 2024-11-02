"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = () => {
      const getCookieUser = () => {
        const userCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user='));
        if (userCookie) {
          return JSON.parse(userCookie.split('=')[1]);
        }
        return null;
      };

      setUser(getCookieUser());
    };

    checkUser();

    window.addEventListener('storage', checkUser);

    return () => {
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  if (!user) {
    return null;
  }

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          实收管理
        </Link>
        <div className="space-x-4">
          <Link 
            href="/sales-form" 
            className={`hover:text-gray-300 ${pathname === '/sales-form' ? 'underline' : ''}`}
          >
            录入成交
          </Link>
          <Link 
            href="/sales-records" 
            className={`hover:text-gray-300 ${pathname === '/sales-records' ? 'underline' : ''}`}
          >
            成交记录
          </Link>
          <Link 
            href="/sales-charts" 
            className={`hover:text-gray-300 ${pathname === '/sales-charts' ? 'underline' : ''}`}
          >
            成交图表
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
