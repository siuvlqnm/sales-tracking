"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { submitSalesRecords } from '@/lib/api';
import { StoreSelector } from '@/components/ui/store-selector';

export default function SalesForm() {
  const { user } = useAuth();
  const [amounts, setAmounts] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validAmounts, setValidAmounts] = useState<number[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStoreId) {
      setSubmitStatus({ 
        success: false, 
        message: '请选择门店' 
      });
      return;
    }

    setValidAmounts(amounts.filter(amount => amount).map(amount => parseFloat(amount)));
    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    if (!user || !selectedStoreId) return;

    setIsSubmitting(true);
    setSubmitStatus({ success: false, message: '' });

    try {
      await submitSalesRecords(selectedStoreId, validAmounts);
      setSubmitStatus({ 
        success: true, 
        message: `提交成功！` 
      });
      setAmounts(['']);
      setShowConfirmDialog(false);
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
            请输入您的实际成交金额，可添加多笔记录（最多10笔）
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleFormSubmit}>
          <CardContent className="space-y-3">
            <StoreSelector 
              value={selectedStoreId}
              onChange={setSelectedStoreId}
              className="w-full"
            />
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
              <Alert 
                variant={submitStatus.success ? "default" : "destructive"}
                className={`
                  ${submitStatus.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50'} 
                  shadow-sm
                `}
              >
                <div className="flex items-center">
                  {submitStatus.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <AlertDescription className="text-base py-1">
                    {submitStatus.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardFooter>
        </form>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认提交</DialogTitle>
            <DialogDescription className="pt-4">
              您确定要提交以下金额吗？
              <div className="mt-4 space-y-2">
                {validAmounts.map((amount, index) => (
                  <div key={index} className="px-4 py-2 bg-muted rounded-md">
                    ¥{amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </div>
                ))}
                <div className="pt-2 font-medium">
                  总计: ¥{validAmounts.reduce((sum, amount) => sum + amount, 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleConfirmedSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '确认提交'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
