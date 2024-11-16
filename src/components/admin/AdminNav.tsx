'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    {
      title: "系统管理",
      href: "/management-console",
    },
    {
      title: "商品管理",
      href: "/management-console/products",
    },
  ];

  return (
    <nav className="flex space-x-4 border-b mb-6 px-4 py-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
} 