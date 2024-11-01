"use client";

import React, { useState, useEffect, useCallback } from 'react';
// import { useSession } from 'next-auth/react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { getChartData, type ChartData } from '@/lib/api';

export default function SalesCharts() {
//   const { data: session } = useSession();
  const [timeRange, setTimeRange] = useState('7');
  const [salesData, setSalesData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(timeRange));
      const data = await getChartData({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });
      setSalesData(data);
    } catch (err) {
      setError('加载图表数据失败，请重试。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchChartData();
  }, [timeRange, fetchChartData]);

  if (loading) return <div className="text-center py-10">加载中...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!salesData) return null;

  const maxSalespersonTotal = Math.max(...salesData.topSalespeople.map(s => s.total));
  const maxStoreTotal = Math.max(...salesData.storePerformance.map(s => s.total));

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
        <Card>
          <CardHeader>
            <CardTitle>门店销售占比</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {salesData.storePerformance.map((store, index) => (
                <li key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span>{store.name}</span>
                    <span>¥{store.total.toFixed(2)}</span>
                  </div>
                  <Progress value={(store.total / maxStoreTotal) * 100} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
