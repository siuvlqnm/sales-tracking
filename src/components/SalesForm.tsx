"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 假设这是你的 Worker URL
// const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev';
const WORKER_URL = 'localhost:3000';

// Add this interface at the top of your file
interface SalesInfo {
  salesperson_id: string;
  store_id: string;
  salesperson_name: string;
  store_name: string;
}

export default function SalesForm() {
  const [trackingId, setTrackingId] = useState('');
  const [amounts, setAmounts] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });
  const [salesInfo, setSalesInfo] = useState<SalesInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tracking = searchParams.get('tracking');
    if (tracking) {
      setTrackingId(tracking);
      fetchSalesInfo(tracking);
    } else {
      setIsLoading(false);
      setSubmitStatus({
        success: false,
        message: '无效的访问链接，请使用正确的销售链接。'
      });
    }
  }, [searchParams]);

  const fetchSalesInfo = async (tracking: string) => {
    try {
      const response = await fetch(`${WORKER_URL}/api/salesInfo?tracking_id=${tracking}`);
      if (!response.ok) throw new Error('Failed to fetch sales info');
      const data = await response.json();
      setSalesInfo(data);
    } catch (error) {
      console.error('Error fetching sales info:', error);
      setSubmitStatus({
        success: false,
        message: '获取销售信息失败，请重试。'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAmount = () => {
    if (amounts.length < 10) { // 限制最多10个输入框
      setAmounts([...amounts, '']);
    }
  };

  const handleRemoveAmount = (index: number) => {
    const newAmounts = amounts.filter((_, i) => i !== index);
    setAmounts(newAmounts);
  };

  const handleAmountChange = (index: number, value: string) => {
    // 验证输入值
    const numValue = parseFloat(value);
    if (value && (isNaN(numValue) || numValue < 0 || numValue > 1000000)) {
      return; // 不允许负数或超过100万的数值
    }
    
    const newAmounts = [...amounts];
    newAmounts[index] = value;
    setAmounts(newAmounts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesInfo) {
      setSubmitStatus({
        success: false,
        message: '缺少销售人员信息，无法提交数据。'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ success: false, message: '' });

    const validAmounts = amounts.filter(amount => amount).map(amount => parseFloat(amount));
    if (validAmounts.length === 0) {
      setSubmitStatus({
        success: false,
        message: '请至少输入一个有效金额。'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${WORKER_URL}/api/recordSales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salesperson_id: salesInfo.salesperson_id,
          store_id: salesInfo.store_id,
          amounts: validAmounts,
          timestamp: new Date().toISOString(),
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || '提交失败');

      setSubmitStatus({ 
        success: true, 
        message: `提交成功！${data.message}。销售员：${salesInfo.salesperson_name}，门店：${salesInfo.store_name}` 
      });
      setAmounts(['']);
    } catch (error: unknown) {
      setSubmitStatus({ 
        success: false, 
        message: error instanceof Error ? error.message : '提交失败，请重试。' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 pb-4">
        <CardDescription className="text-sm sm:text-base text-center">
          请输入您的成交金额，可添加多笔记录（最多10笔）
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Alert>
              <AlertDescription>正在验证访问权限...</AlertDescription>
            </Alert>
          ) : salesInfo ? (
            <>
              {amounts.map((amount, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="请输入金额"
                    value={amount}
                    onChange={(e) => handleAmountChange(index, e.target.value)}
                    required
                    min="0"
                    max="1000000"
                    step="0.01"
                    className="flex-grow text-base"
                  />
                  {amounts.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleRemoveAmount(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {amounts.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleAddAmount}
                >
                  <Plus className="h-4 w-4 mr-2" /> 添加金额
                </Button>
              )}
            </>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                {submitStatus.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-2">
          {salesInfo && (
            <Button 
              type="submit" 
              className="w-full text-base py-5" 
              disabled={isSubmitting || amounts.every(a => !a)}
            >
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isSubmitting ? '提交中...' : '提交'}
            </Button>
          )}
          {submitStatus.message && submitStatus.success && (
            <Alert variant="default">
              <AlertDescription className="text-sm">
                {submitStatus.message}
              </AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
