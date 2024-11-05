"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardData, type DashboardData } from '@/lib/api';
import { Loader2 } from "lucide-react"; 
import { StoreSelector } from '@/components/ui/store-selector';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardViewProps {
  dashboardData: DashboardData;
  storeId: string;
  onStoreChange: (storeId: string) => void;
}

// 销售人员视图
function SalespersonView({ dashboardData, storeId, onStoreChange }: DashboardViewProps) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">欢迎回来，{user.name}老师</h1>
        <StoreSelector 
          value={storeId}
          onChange={onStoreChange}
          className="w-[180px]"
        />
      </div>

      <PerformanceCard performance={dashboardData.performance} />
      <SalespersonActions />
      <RecentSalesCard recentSales={dashboardData.recentSales} />
    </div>
  );
}

// 店长视图
function ManagerView({ dashboardData, storeId, onStoreChange }: DashboardViewProps) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{user.name}老师，团队业绩概览</h1>
        <StoreSelector 
          value={storeId}
          onChange={onStoreChange}
          className="w-[180px]"
        />
      </div>

      <PerformanceCard performance={dashboardData.performance} />
      <ManagerActions />
      <TopSalespeopleCard topSalespeople={dashboardData.topSalespeople} />
    </div>
  );
}

// 性能卡片组件
function PerformanceCard({ performance }: { performance: DashboardData['performance'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>本月业绩</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="flex justify-between">
            <span>实收额：</span>
            <span className="font-medium">
              ¥{performance.monthlySales.toLocaleString('zh-CN', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </span>
          </p>
          <p className="flex justify-between">
            <span>成单数：</span>
            <span className="font-medium">{performance.monthlyOrders} 笔</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// 销售人员操作按钮
function SalespersonActions() {
  return (
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
  );
}

// 店长操作按钮
function ManagerActions() {
  return (
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
  );
}

// 最近成交卡片
function RecentSalesCard({ recentSales }: { recentSales: DashboardData['recentSales'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近成交</CardTitle>
      </CardHeader>
      <CardContent>
        {recentSales.length === 0 ? (
          <div className="text-center py-4 text-gray-500">暂无成交记录</div>
        ) : (
          <ul className="space-y-3">
            {recentSales.map((sale) => (
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
  );
}

// Top销售卡片
function TopSalespeopleCard({ topSalespeople }: { topSalespeople: DashboardData['topSalespeople'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top老师</CardTitle>
      </CardHeader>
      <CardContent>
        {topSalespeople.length === 0 ? (
          <div className="text-center py-4 text-gray-500">暂无数据</div>
        ) : (
          <ul className="space-y-3">
            {topSalespeople.map((person, index) => (
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
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  useEffect(() => {
    if (!user) return;

    setSelectedStoreId(user.storeIds.length === 1 ? user.storeIds[0] : 'all');
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const data = await getDashboardData({ 
          userId: user!.role === 'salesperson' ? user!.id : undefined,
          storeId: selectedStoreId === 'all' ? undefined : selectedStoreId
        });
        setDashboardData(data);
      } catch (err) {
        setError('加载数据失败，请重试');
        console.error(err);
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, [user, selectedStoreId]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!user || !dashboardData) return null;

  const ViewComponent = user.role === 'manager' ? ManagerView : SalespersonView;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ViewComponent 
        dashboardData={dashboardData}
        storeId={selectedStoreId}
        onStoreChange={setSelectedStoreId}
      />
    </div>
  );
}
