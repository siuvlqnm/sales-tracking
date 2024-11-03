"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardData, type DashboardData } from '@/lib/api';
import { Loader2 } from "lucide-react"; 
import { User } from '@/lib/authUtils';
import { StoreSelector } from '@/components/ui/store-selector';
import { getUser } from '@/lib/authUtils';

// 销售人员视图
function SalespersonView({ user }: { user: User }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    user.storeIds.length === 1 ? user.storeIds[0] : 'all'
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDashboardData({ 
          userId: user.id,
          storeId: selectedStoreId === 'all' ? undefined : selectedStoreId
        });
        setDashboardData(data);
      } catch (err) {
        setError('加载数据失败，请重试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.id, selectedStoreId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">欢迎回来，{user.name}老师</h1>
        <StoreSelector 
          value={selectedStoreId}
          onChange={setSelectedStoreId}
          className="w-[180px]"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>本月业绩</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="flex justify-between">
              <span>实收额：</span>
              <span className="font-medium">
                ¥{dashboardData.performance.monthlySales.toLocaleString('zh-CN', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </span>
            </p>
            <p className="flex justify-between">
              <span>成单数：</span>
              <span className="font-medium">{dashboardData.performance.monthlyOrders} 笔</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          <Link href="/sales-form" className="w-full">
            <Button className="w-full">录入成交</Button>
          </Link>
          <Link href="/sales-records" className="w-full">
            <Button className="w-full" variant="outline">我的成交记录</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近成交</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.recentSales.length === 0 ? (
            <div className="text-center py-4 text-gray-500">暂无成交记录</div>
          ) : (
            <ul className="space-y-3">
              {dashboardData.recentSales.map((sale) => (
                <li key={sale.id} className="flex justify-between items-center">
                  <span className="text-gray-600">{sale.date}</span>
                  <span className="font-medium">
                    ¥{sale.amount.toLocaleString('zh-CN', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    user.storeIds.length === 1 ? user.storeIds[0] : 'all'
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDashboardData({ 
          storeId: selectedStoreId === 'all' ? undefined : selectedStoreId 
        });
        setDashboardData(data);
      } catch (err) {
        setError('加载数据失败，请重试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedStoreId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{user.name}老师，团队业绩概览</h1>
        <StoreSelector 
          value={selectedStoreId}
          onChange={setSelectedStoreId}
          className="w-[180px]"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>本月业绩</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="flex justify-between">
              <span>实收额：</span>
              <span className="font-medium">
                ¥{dashboardData.performance.monthlySales.toLocaleString('zh-CN', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </span>
            </p>
            <p className="flex justify-between">
              <span>成单数：</span>
              <span className="font-medium">{dashboardData.performance.monthlyOrders} 笔</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          <Link href="/sales-records" className="w-full">
            <Button className="w-full">查看所有成交记录</Button>
          </Link>
          <Link href="/sales-charts" className="w-full">
            <Button className="w-full" variant="outline">成交图表</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top老师</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.topSalespeople.length === 0 ? (
            <div className="text-center py-4 text-gray-500">暂无数据</div>
          ) : (
            <ul className="space-y-3">
              {dashboardData.topSalespeople.map((person, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span>{person.name}</span>
                  <span className="font-medium">
                    ¥{person.sales.toLocaleString('zh-CN', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // RouteGuard 会处理重定向
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {user.role === 'manager' ? <ManagerView user={user} /> : <SalespersonView user={user} />}
    </div>
  );
}
