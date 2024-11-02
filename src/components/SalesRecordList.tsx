"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { getUser } from '@/lib/cookieUtils';
import { querySalesRecords } from '@/lib/api';
import type { SalesRecord } from '@/lib/api';
import { StoreSelector } from '@/components/ui/store-selector';

export default function SalesRecordList() {
  const user = getUser();
  const isManager = user?.role === 'manager';

  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [salesperson, setSalesperson] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    // 如果用户只有一个门店，默认选择该门店，否则默认选择 'all'
    user?.storeIds.length === 1 ? user.storeIds[0] : 'all'
  );

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const params: {
        userId?: string;
        storeId?: string;
        startDate?: string;
        endDate?: string;
      } = {};

      // 设置查询参数
      if (user.role === 'salesperson') {
        params.userId = user.id;
      } else if (salesperson) {
        params.userId = salesperson;
      }

      // 设置门店参数
      if (selectedStoreId !== 'all') {
        params.storeId = selectedStoreId;
      }

      // 设置日期范围
      if (date) {
        const dateStr = format(date, 'yyyy-MM-dd');
        params.startDate = dateStr;
        params.endDate = dateStr;
      }

      const records = await querySalesRecords(params);
      setRecords(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载记录失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date, salesperson, selectedStoreId, user]);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [fetchRecords, user]);

  if (!user) {
    return <div className="text-center py-10">请先登录</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">成交记录</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>选择日期</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        {isManager && (
          <Input
            placeholder="输入老师ID查询"
            value={salesperson}
            onChange={(e) => setSalesperson(e.target.value)}
          />
        )}

        <StoreSelector 
          value={selectedStoreId}
          onChange={setSelectedStoreId}
          className="w-full"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无记录</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>老师</TableHead>
                <TableHead>门店</TableHead>
                <TableHead className="text-right">金额</TableHead>
                <TableHead className="text-right">时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.user_name}</TableCell>
                  <TableCell>{record.store_name}</TableCell>
                  <TableCell className="text-right">
                    ¥{record.actual_amount.toLocaleString('zh-CN', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {format(new Date(record.submission_time), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
