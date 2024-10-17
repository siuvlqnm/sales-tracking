"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

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
            录入销售
          </Link>
          <Link 
            href="/sales-records" 
            className={`hover:text-gray-300 ${pathname === '/sales-records' ? 'underline' : ''}`}
          >
            销售记录
          </Link>
          <Link 
            href="/sales-charts" 
            className={`hover:text-gray-300 ${pathname === '/sales-charts' ? 'underline' : ''}`}
          >
            销售图表
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
