"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { getChartData, type ChartData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";
import { StoreSelector } from '@/components/ui/store-selector';

export default function SalesCharts() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState(format(new Date(), 'yyyy-MM'));
  const [salesData, setSalesData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  const fetchChartData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const [year, month] = timeRange.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const formatDate = (date: Date) => {
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const cst = new Date(utc + (8 * 3600000));
        return format(cst, 'yyyy-MM-dd');
      };

      const data = await getChartData({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        storeId: selectedStoreId === 'all' ? undefined : selectedStoreId
      });
      setSalesData(data);
    } catch (err) {
      setError('加载图表数据失败，请重试。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedStoreId, user]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (!salesData) {
    return <div className="text-center py-10 text-gray-500">暂无数据</div>;
  }

  const maxSalespersonTotal = Math.max(...(salesData.topSalespeople?.map(s => s.total) || [0]));
  const maxProductCount = Math.max(...salesData.productPerformance.map(p => p.count));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">成交数据分析</h1>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择月份" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(3)].map((_, index) => {
              const date = new Date();
              date.setMonth(date.getMonth() - index);
              const value = format(date, 'yyyy-MM');
              const label = format(date, 'yyyy年M月');
              return (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <StoreSelector 
          value={selectedStoreId}
          onChange={setSelectedStoreId}
          className="w-[180px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 每日成交额卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>每日成交额</CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.dailySales.length === 0 ? (
              <div className="text-center py-4 text-gray-500">暂无数据</div>
            ) : (
              <ul className="space-y-2">
                {salesData.dailySales.map((day, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{day.date}</span>
                    <span>¥{day.total.toLocaleString('zh-CN', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 销售人员排名卡片 - 仅管理员可见 */}
        {user?.role === 'manager' && salesData.topSalespeople && (
          <Card>
            <CardHeader>
              <CardTitle>老师业绩排名</CardTitle>
            </CardHeader>
            <CardContent>
              {salesData.topSalespeople.length === 0 ? (
                <div className="text-center py-4 text-gray-500">暂无数据</div>
              ) : (
                <ul className="space-y-4">
                  {salesData.topSalespeople.map((person, index) => (
                    <li key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span>{person.name}</span>
                        <span>¥{person.total.toLocaleString('zh-CN', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })}</span>
                      </div>
                      <Progress 
                        value={(person.total / maxSalespersonTotal) * 100} 
                        className="h-2"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* 商品销售占比卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>商品销售占比</CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.productPerformance.length === 0 ? (
              <div className="text-center py-4 text-gray-500">暂无数据</div>
            ) : (
              <ul className="space-y-4">
                {salesData.productPerformance.map((product, index) => (
                  <li key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span>¥{product.amount.toLocaleString('zh-CN', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}</span>
                      <span>{product.count} 笔</span>
                    </div>
                    <Progress 
                      value={(product.count / maxProductCount) * 100} 
                      className="h-2"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
