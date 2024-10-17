"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser, User } from '@/lib/auth';
import { 
  generateSalesRecords, 
  generatePerformanceData, 
  generateTopSalespeople, 
  generateTeamPerformance,
  SalesRecord,
  PerformanceData,
  Salesperson
} from '@/lib/testData';

// 销售人员视图
function SalespersonView({ user }: { user: User }) {
  const [recentSales, setRecentSales] = useState<SalesRecord[]>([]);
  const [performance, setPerformance] = useState<PerformanceData>({ monthlySales: 0, monthlyOrders: 0 });

  useEffect(() => {
    // 使用测试数据生成函数
    setRecentSales(generateSalesRecords(5));
    setPerformance(generatePerformanceData());
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>欢迎回来，{user.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>您的本月业绩：</p>
          <p>销售额：¥{performance.monthlySales.toLocaleString()}</p>
          <p>订单数：{performance.monthlyOrders}</p>
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
          <Link href="/my-sales-records">
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
            {recentSales.map((sale) => (
              <li key={sale.id} className="mb-2">
                {sale.customer} - ¥{sale.amount} ({sale.date})
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// 店长视图
function ManagerView() {
  const [teamPerformance, setTeamPerformance] = useState<PerformanceData>({ monthlySales: 0, monthlyOrders: 0 });
  const [topSalespeople, setTopSalespeople] = useState<Salesperson[]>([]);

  useEffect(() => {
    // 使用测试数据生成函数
    setTeamPerformance(generateTeamPerformance());
    setTopSalespeople(generateTopSalespeople(5));
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>团队业绩概览</CardTitle>
        </CardHeader>
        <CardContent>
          <p>本月销售额：¥{teamPerformance.monthlySales.toLocaleString()}</p>
          <p>本月订单数：{teamPerformance.monthlyOrders}</p>
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
            {topSalespeople.map((person, index) => (
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
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">销售管理系统</h1>
      {user.role === 'salesperson' ? <SalespersonView user={user} /> : <ManagerView />}
    </main>
  );
}
