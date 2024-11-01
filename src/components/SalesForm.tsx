"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getUser } from '@/lib/userManager';
import { submitSalesRecords } from '@/lib/api';

export default function SalesForm() {
  const [amounts, setAmounts] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });

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

  const handleSubmit = async () => {
    const user = getUser();
    if (!user) {
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
      await submitSalesRecords(user.id, user.storeId, validAmounts);
      setSubmitStatus({ 
        success: true, 
        message: `提交成功！` 
      });
      setAmounts(['']);
    } catch (error) {
      setSubmitStatus({ 
        success: false, 
        message: error instanceof Error ? error.message : '提交失败，请重试。' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">录入金额</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              请输入您的成交金额，可添加多笔记录（最多10笔）
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3">
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button 
                type="submit" 
                className="w-full text-base py-5" 
                disabled={isSubmitting || amounts.every(a => !a)}
              >
                {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isSubmitting ? '提交中...' : '提交'}
              </Button>
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
      </div>
  );
}
