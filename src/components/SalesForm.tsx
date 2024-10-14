"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SalesForm() {
  const [amounts, setAmounts] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });
  const [trackingId, setTrackingId] = useState<string | null>(null);

  useEffect(() => {
    // 从URL中获取追踪参数
    const urlParams = new URLSearchParams(window.location.search);
    const trackingParam = urlParams.get('tracking');
    
    if (!trackingParam) {
      setSubmitStatus({
        success: false,
        message: '无效的访问链接，请使用正确的销售链接。'
      });
    } else {
      // 验证追踪参数格式
      const isValidTracking = /^[A-Za-z0-9_-]{10,32}$/.test(trackingParam);
      if (isValidTracking) {
        setTrackingId(trackingParam);
      } else {
        setSubmitStatus({
          success: false,
          message: '无效的追踪参数，请联系管理员。'
        });
      }
    }
  }, []);

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
    if (!trackingId) {
      setSubmitStatus({
        success: false,
        message: '缺少有效的追踪参数，无法提交数据。'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ success: false, message: '' });

    // 过滤掉空值并验证数据
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
      const response = await fetch('/api/submit-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 添加CSRF令牌（如果有的话）
          // 'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({
          tracking_id: trackingId,
          amounts: validAmounts,
          timestamp: new Date().toISOString(),
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || '提交失败');

      setSubmitStatus({ 
        success: true, 
        message: `提交成功！共提交 ${validAmounts.length} 笔成交金额。` 
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
          {trackingId ? (
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
                {submitStatus.message || '正在验证访问权限...'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-2">
          {trackingId && (
            <Button 
              type="submit" 
              className="w-full text-base py-5" 
              disabled={isSubmitting || amounts.every(a => !a)}
            >
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isSubmitting ? '提交中...' : '提交'}
            </Button>
          )}
          {submitStatus.message && (
            <Alert variant={submitStatus.success ? "default" : "destructive"}>
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
