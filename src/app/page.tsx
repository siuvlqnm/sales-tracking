"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardData, type DashboardData } from '@/lib/api';
import type { User } from '@/lib/types';

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

  if (loading) return <div>加载中...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>欢迎回来，{user.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>您的本月业绩：</p>
          <p>销售额：¥{dashboardData.performance.monthlySales.toLocaleString()}</p>
          <p>订单数：{dashboardData.performance.monthlyOrders}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          <Link href="/sales-form">
            <Button className="w-full">录入新销售</Button>
          </Link>
          <Link href="/sales-records">
            <Button className="w-full">我的销售记录</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近销售</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {dashboardData.recentSales.map((sale) => (
              <li key={sale.id} className="mb-2">
                {sale.user_name} - ¥{sale.amount} ({sale.date})
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

  if (loading) return <div>加载中...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>团队业绩概览</CardTitle>
        </CardHeader>
        <CardContent>
          <p>本月销售额：¥{dashboardData.performance.monthlySales.toLocaleString()}</p>
          <p>本月订单数：{dashboardData.performance.monthlyOrders}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          <Link href="/sales-records">
            <Button className="w-full">查看所有销售记录</Button>
          </Link>
          <Link href="/sales-charts">
            <Button className="w-full">销售图表</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top销售人员</CardTitle>
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
