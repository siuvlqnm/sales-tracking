"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { getChartData, type ChartData } from '@/lib/api';
import { getUser } from '@/lib/userManager';

export default function SalesCharts() {
  const user = getUser();
  const [timeRange, setTimeRange] = useState('7');
  const [salesData, setSalesData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = user?.id;
  const userRole = user?.role;

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(timeRange));
      const data = await getChartData({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        userId: userRole === 'salesperson' ? userId : undefined,
        role: userRole
      });
      setSalesData(data);
    } catch (err) {
      setError('加载图表数据失败，请重试。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, userId, userRole]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  if (loading) return <div className="text-center py-10">加载中...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!salesData) return null;

  const maxSalespersonTotal = Math.max(...(salesData.topSalespeople?.map(s => s.total) || [0]));
  const maxProductCount = Math.max(...salesData.productPerformance.map(p => p.count));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">销售数据分析</h1>
      <div className="mb-6">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择时间范围" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">过去7天</SelectItem>
            <SelectItem value="30">过去30天</SelectItem>
            <SelectItem value="90">过去90天</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>每日销售额</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {salesData.dailySales.map((day, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span>{day.date}</span>
                  <span>¥{day.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        {/* 只有管理员才能看到销售人员排名 */}
        {user?.role === 'manager' && salesData.topSalespeople && (
          <Card>
            <CardHeader>
              <CardTitle>销售人员业绩排名</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {salesData.topSalespeople.map((person, index) => (
                  <li key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span>{person.name}</span>
                      <span>¥{person.total.toFixed(2)}</span>
                    </div>
                    <Progress value={(person.total / maxSalespersonTotal) * 100} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>商品销售占比</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {salesData.productPerformance.map((product, index) => (
                <li key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span>¥{product.amount.toFixed(2)}</span>
                    <span>{product.count} 笔</span>
                  </div>
                  <Progress value={(product.count / maxProductCount) * 100} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
