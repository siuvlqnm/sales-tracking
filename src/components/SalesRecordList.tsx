"use client";

import React, { useState, useEffect, useCallback } from 'react';
// import { useSession } from 'next-auth/react';
import { format, subDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface SalesRecord {
  id: string;
  salesperson_name: string;
  store_name: string;
  amount: number;
  timestamp: string;
}

// 生成测试数据的函数
const generateTestData = (count: number): SalesRecord[] => {
  const salespeople = ['张三', '李四', '王五', '赵六', '钱七'];
  const stores = ['北京店', '上海店', '广州店', '深圳店', '杭州店'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `record-${i + 1}`,
    salesperson_name: salespeople[Math.floor(Math.random() * salespeople.length)],
    store_name: stores[Math.floor(Math.random() * stores.length)],
    amount: Math.floor(Math.random() * 10000) + 100,
    timestamp: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd HH:mm:ss')
  }));
};

export default function SalesRecordList() {
//   const { data: session } = useSession();
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [salesperson, setSalesperson] = useState('');
  const [store, setStore] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
    // const queryParams = new URLSearchParams({
    // date: date ? format(date, 'yyyy-MM-dd') : '',
    // salesperson: salesperson,
    // store: store,
    // });
    // const response = await fetch(`${WORKER_URL}/api/salesRecords?${queryParams}`, {
    // // headers: {
    // //   'Authorization': `Bearer ${session?.user?.accessToken}`,
    // // },
    // });
    // if (!response.ok) throw new Error('Failed to fetch records');
    // const data = await response.json();
    // setRecords(data);

      // 模拟 API 请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成测试数据
      let filteredRecords = generateTestData(50);
      
      // 根据筛选条件过滤数据
      if (date) {
        const dateStr = format(date, 'yyyy-MM-dd');
        filteredRecords = filteredRecords.filter(record => record.timestamp.startsWith(dateStr));
      }
      if (salesperson) {
        filteredRecords = filteredRecords.filter(record => 
          record.salesperson_name.toLowerCase().includes(salesperson.toLowerCase())
        );
      }
      if (store) {
        filteredRecords = filteredRecords.filter(record => 
          record.store_name.toLowerCase().includes(store.toLowerCase())
        );
      }
      
      setRecords(filteredRecords);
    } catch (err) {
      setError('Failed to load records. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date, salesperson, store]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

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
        <Input
          placeholder="销售员名称"
          value={salesperson}
          onChange={(e) => setSalesperson(e.target.value)}
        />
        <Input
          placeholder="门店名称"
          value={store}
          onChange={(e) => setStore(e.target.value)}
        />
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
                  <TableCell>{record.salesperson_name}</TableCell>
                  <TableCell>{record.store_name}</TableCell>
                  <TableCell>{record.amount.toFixed(2)}</TableCell>
                  {/* <TableCell>{format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell> */}
                  <TableCell>{record.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
