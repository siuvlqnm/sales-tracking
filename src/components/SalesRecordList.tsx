"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { getUser } from '@/lib/cookieUtils';
import { querySalesRecords } from '@/lib/api';
import type { SalesRecord } from '@/lib/api';

export default function SalesRecordList() {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [salesperson, setSalesperson] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const user = getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const params: {
        userId?: string;
        storeId?: string;
        startDate?: string;
        endDate?: string;
      } = {};

      // 根据用户角色设置查询参数
      if (user.role === 'salesperson') {
        params.userId = user.id;
        params.storeId = user.storeId;
      } else if (user.role === 'manager') {
        params.storeId = user.storeId;
        if (salesperson) {
          params.userId = salesperson;
        }
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
  }, [date, salesperson]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const user = getUser();
  const isManager = user?.role === 'manager';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">销售记录</h1>
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
          <PopoverContent className="w-auto p-0">
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
            placeholder="销售员ID"
            value={salesperson}
            onChange={(e) => setSalesperson(e.target.value)}
          />
        )}
      </div>
      {loading ? (
        <p>加载中...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>销售员</TableHead>
                <TableHead>门店</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.user_name}</TableCell>
                  <TableCell>{record.store_name}</TableCell>
                  <TableCell>¥{record.actual_amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{format(new Date(record.submission_time), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
