"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardData, type DashboardData } from '@/lib/api';
import type { User } from '@/lib/types';
import { Loader2 } from "lucide-react"; 

// 销售人员视图
function SalespersonView({ user }: { user: User }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDashboardData({ userId: user.id });
        setDashboardData(data);
      } catch (err) {
        setError('加载数据失败，请重试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (error) return <div className="text-red-500">{error}</div>;
  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>欢迎回来，{user.name}老师</CardTitle>
        </CardHeader>
        <CardContent>
          <p>您的本月业绩：</p>
          <p>实收额：¥{dashboardData.performance.monthlySales.toLocaleString()}</p>
          <p>成单数：{dashboardData.performance.monthlyOrders}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          <Link href="/sales-form">
            <Button className="w-full">录入成交</Button>
          </Link>
          <Link href="/sales-records">
            <Button className="w-full">我的成交记录</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近成交</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {dashboardData.recentSales.map((sale) => (
              <li key={sale.id} className="mb-2">
                ¥{sale.amount} - {sale.date}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// 店长视图
function ManagerView({ user }: { user: User }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDashboardData({ storeId: user.storeId });
        setDashboardData(data);
      } catch (err) {
        setError('加载数据失败，请重试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.storeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (error) return <div className="text-red-500">{error}</div>;
  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{user.name}老师，团队业绩概览</CardTitle>
        </CardHeader>
        <CardContent>
          <p>本月实收额：¥{dashboardData.performance.monthlySales.toLocaleString()}</p>
          <p>本月成单数：{dashboardData.performance.monthlyOrders}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          <Link href="/sales-records">
            <Button className="w-full">查看所有成交记录</Button>
          </Link>
          <Link href="/sales-charts">
            <Button className="w-full">成交图表</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top老师</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {dashboardData.topSalespeople.map((person, index) => (
              <li key={index} className="mb-2">
                {person.name} - ¥{person.sales}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {user ? (
        user.role === 'manager' ? <ManagerView user={user} /> : <SalespersonView user={user} />
      ) : null}
    </div>
  );
}
