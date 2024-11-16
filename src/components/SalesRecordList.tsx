"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { querySalesRecords, deleteSalesRecord, type SalesRecord } from '@/lib/api';
import { StoreSelector } from '@/components/ui/store-selector';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function SalesRecordList() {
  const { user } = useAuth();
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    recordId: string | null;
    reason: string;
  }>({
    isOpen: false,
    recordId: null,
    reason: ''
  });

  const fetchRecords = useCallback(async () => {
    if (!user || !date) return;
    
    try {
      setLoading(true);
      // 设置当天的开始和结束时间戳
      const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      startTime.setHours(startTime.getHours() + 8); // 调整为东八区
      const startTs = startTime.getTime();
      
      const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      endTime.setHours(endTime.getHours() + 8); // 调整为东八区
      const endTs = endTime.getTime();

      const data = await querySalesRecords({
        startTs,
        endTs,
        storeID: selectedStoreId === 'all' ? undefined : selectedStoreId
      });
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  }, [date, selectedStoreId, user]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDeleteClick = (recordId: string) => {
    setDeleteDialog({
      isOpen: true,
      recordId,
      reason: ''
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.recordId || !deleteDialog.reason) return;

    try {
      setLoading(true);
      await deleteSalesRecord(deleteDialog.recordId, deleteDialog.reason);
      await fetchRecords();
      setDeleteDialog({ isOpen: false, recordId: null, reason: '' });
    } catch (error) {
      console.error('Error deleting record:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportMonthlyData = async () => {
    if (!date) return;
    
    try {
      // 获取当月第一天和最后一天的时间戳
      const startTime = new Date(date.getFullYear(), date.getMonth(), 1);
      startTime.setHours(startTime.getHours() + 8); // 调整为东八区
      const startTs = startTime.getTime();
      
      const endTime = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      endTime.setHours(endTime.getHours() + 8); // 调整为东八区
      const endTs = endTime.getTime();
      
      // 获取当月所有数据
      const monthlyData = await querySalesRecords({
        startTs,
        endTs,
        storeID: selectedStoreId === 'all' ? undefined : selectedStoreId
      });

      // 准备CSV数据
      const headers = ['订单号', '客户姓名', '手机号', '商品', '老师', '门店', '金额', '提交时间', '备注'];
      
      const rows = monthlyData.map(record => [
        record.orderNo,
        record.customerName,
        record.phone || '',
        record.productName,
        record.userName,
        record.storeName,
        record.actualAmount.toString(),
        format(new Date(record.submitTs), 'yyyy-MM-dd HH:mm:ss'),
        record.notes || ''
      ]);

      // 组合所有行
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          typeof cell === 'string' && (cell.includes(',') || cell.includes('\n') || cell.includes('"'))
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(','))
      ].join('\n');

      // 创建并下载文件
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `成交记录-${format(date, 'yyyy-MM')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">成交记录</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "flex-1 justify-start text-left font-normal",
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

        <StoreSelector 
          value={selectedStoreId}
          onChange={setSelectedStoreId}
          className="w-full"
        />
      </div>
      
      {user?.role !== 'salesperson' && (
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            onClick={exportMonthlyData}
            disabled={!date || selectedStoreId === 'all'}
          >
            <Download className="mr-2 h-4 w-4" />
            {selectedStoreId === 'all' ? '请选择门店' : '导出当月数据'}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无记录</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {user?.role !== 'salesperson' && <TableHead>老师</TableHead>}
                <TableHead>门店</TableHead>
                <TableHead>订单号</TableHead>
                <TableHead>客户姓名</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>商品</TableHead>
                <TableHead className="text-right">金额</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-right">时间</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  {user?.role !== 'salesperson' && <TableCell>{record.userName}</TableCell>}
                  <TableCell>{record.storeName}</TableCell>
                  <TableCell>{record.orderNo}</TableCell>
                  <TableCell>{record.customerName}</TableCell>
                  <TableCell>{record.phone || 'N/A'}</TableCell>
                  <TableCell>{record.productName}</TableCell>
                  <TableCell className="text-right">
                    ¥{record.actualAmount.toLocaleString('zh-CN', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </TableCell>
                  <TableCell>{record.notes || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {format(new Date(record.submitTs), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => 
        setDeleteDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除记录</DialogTitle>
            <DialogDescription>
              请输入删除原因，此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="请输入删除原因"
            value={deleteDialog.reason}
            onChange={(e) => setDeleteDialog(prev => ({ 
              ...prev, 
              reason: e.target.value 
            }))}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ 
                isOpen: false, 
                recordId: null, 
                reason: '' 
              })}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={!deleteDialog.reason}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
