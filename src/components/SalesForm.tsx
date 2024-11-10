"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
import { getUserStores } from '@/lib/authUtils';

interface SalesRecord {
  amount: string;
  customerName: string;
  phoneNumber: string;
  cardType: string;
  notes: string;
}

export default function SalesForm() {
  const { user } = useAuth();
  const [amounts, setAmounts] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validAmounts, setValidAmounts] = useState<number[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [records, setRecords] = useState<SalesRecord[]>([{
    amount: '',
    customerName: '',
    phoneNumber: '',
    cardType: '',
    notes: ''
  }]);

  useEffect(() => {
    const initializeStore = async () => {
      try {
        const stores = await getUserStores();
        if (stores && stores.length === 1) {
          setSelectedStoreId(stores[0].store_id);
        }
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      }
    };

    initializeStore();
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
    const newAmounts = [...amounts];
    newAmounts[index] = value;
    setAmounts(newAmounts);
  };

  const handleAddRecord = () => {
    if (records.length < 10) {
      setRecords([...records, {
        amount: '',
        customerName: '',
        phoneNumber: '',
        cardType: '',
        notes: ''
      }]);
    }
  };

  const handleRemoveRecord = (index: number) => {
    const newRecords = records.filter((_, i) => i !== index);
    setRecords(newRecords);
  };

  const handleRecordChange = (index: number, field: keyof SalesRecord, value: string) => {
    const newRecords = [...records];
    newRecords[index] = { ...newRecords[index], [field]: value };
    setRecords(newRecords);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validRecords = records.filter(record => 
      record.amount.trim() !== '' && 
      record.customerName.trim() !== '' && 
      record.cardType.trim() !== ''
    );

    if (validRecords.length === 0) {
      setSubmitStatus({ 
        success: false, 
        message: '请至少输入一条完整的销售记录（金额、客户姓名和卡项为必填）' 
      });
      setShowResultDialog(true);
      return;
    }

    if (!selectedStoreId) {
      setSubmitStatus({ 
        success: false, 
        message: '请选择门店' 
      });
      setShowResultDialog(true);
      return;
    }

    // 验证所有金额是否有效
    const numericAmounts = validRecords.map(record => parseFloat(record.amount));
    if (numericAmounts.some(amount => isNaN(amount) || amount <= 0 || amount > 1000000)) {
      setSubmitStatus({ 
        success: false, 
        message: '请确保所有金额在0-1000000之间' 
      });
      setShowResultDialog(true);
      return;
    }

    setValidAmounts(numericAmounts);
    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    if (!user || !selectedStoreId) return;

    setIsSubmitting(true);
    try {
      await submitSalesRecords(selectedStoreId, validAmounts);
      setSubmitStatus({ 
        success: true, 
        message: '提交成功！' 
      });
      setAmounts(['']);
      setShowConfirmDialog(false);
      setShowResultDialog(true);
    } catch (error) {
      setSubmitStatus({ 
        success: false, 
        message: error instanceof Error ? error.message : '提交失败，请重试。' 
      });
      setShowConfirmDialog(false);
      setShowResultDialog(true);
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
            {records.map((record, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">记录 #{index + 1}</h3>
                  {records.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveRecord(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    type="text"
                    placeholder="客户姓名 *"
                    value={record.customerName}
                    onChange={(e) => handleRecordChange(index, 'customerName', e.target.value)}
                    required
                  />
                  <Input
                    type="text"
                    placeholder="卡项 *"
                    value={record.cardType}
                    onChange={(e) => handleRecordChange(index, 'cardType', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="金额 *"
                    value={record.amount}
                    onChange={(e) => handleRecordChange(index, 'amount', e.target.value)}
                    required
                    min="0"
                    max="1000000"
                    step="0.01"
                  />
                  <Input
                    type="tel"
                    placeholder="手机号"
                    value={record.phoneNumber}
                    onChange={(e) => handleRecordChange(index, 'phoneNumber', e.target.value)}
                    required
                  />
                </div>
                <Input
                  type="text"
                  placeholder="备注"
                  value={record.notes}
                  onChange={(e) => handleRecordChange(index, 'notes', e.target.value)}
                />
              </div>
            ))}
            {records.length < 10 && (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={handleAddRecord}
              >
                <Plus className="h-4 w-4 mr-2" /> 添加记录
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
          </CardFooter>
        </form>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
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
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleConfirmedSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
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

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {submitStatus.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              {submitStatus.success ? '提交成功' : '提交失败'}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {submitStatus.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setShowResultDialog(false)}
              className={`w-full ${submitStatus.success ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
