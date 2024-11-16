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
import { submitSalesRecords, getProducts } from '@/lib/api';
import { StoreSelector } from '@/components/ui/store-selector';
import { getUserStores } from '@/lib/authUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SalesRecord {
  amount: string;
  customerName: string;
  phone: string;
  productID: string;
  notes: string;
}

interface Product {
  productID: string;
  productName: string;
}

export default function SalesForm() {
  const { user } = useAuth();
  // const [amounts, setAmounts] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validAmounts, setValidAmounts] = useState<number[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [records, setRecords] = useState<SalesRecord[]>([{
    amount: '',
    customerName: '',
    phone: '',
    productID: '',
    notes: ''
  }]);
  const [Products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

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

  
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const products = await getProducts();
        setProducts(products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // 可以添加错误提示
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddRecord = () => {
    if (records.length < 10) {
      setRecords([...records, {
        amount: '',
        customerName: '',
        phone: '',
        productID: '',
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
      record.productID.trim() !== ''
    );

    if (validRecords.length === 0) {
      setSubmitStatus({ 
        success: false, 
        message: '请至少输入一条完整的销售记录（金额、客户姓名和商品为必填）' 
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
      const validRecords = records.filter(record => 
        record.amount && record.customerName && record.productID
      );
      await submitSalesRecords(selectedStoreId, validRecords);
      setSubmitStatus({ 
        success: true, 
        message: '提交成功！' 
      });
      // 重置表单
      setRecords([{
        amount: '',
        customerName: '',
        phone: '',
        productID: '',
        notes: ''
      }]);
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
                  <Select
                    value={record.productID}
                    onValueChange={(value) => handleRecordChange(index, 'productID', value)}
                    required
                    disabled={isLoadingProducts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingProducts ? "加载中..." : "选择卡项 *"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingProducts ? (
                        <SelectItem value="loading" disabled>
                          加载中...
                        </SelectItem>
                      ) : Products.length > 0 ? (
                        Products.map((product) => (
                          <SelectItem 
                            key={product.productID} 
                            value={product.productID}
                          >
                            {product.productName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-products" disabled>
                          暂无可用卡项
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                    value={record.phone}
                    onChange={(e) => handleRecordChange(index, 'phone', e.target.value)}
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
              disabled={isSubmitting || records.every(record => 
                !record.amount || !record.customerName || !record.productID
              )}
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
              请确认以下销售记录：
              <div className="mt-4 space-y-4">
                {records.filter(record => 
                  record.amount && record.customerName && record.productID
                ).map((record, index) => {
                  const product = Products.find(p => p.productID === record.productID);
                  return (
                    <div key={index} className="p-4 bg-muted rounded-md space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">客户姓名：</span>
                        <span>{record.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">商品：</span>
                        <span>{product?.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">金额：</span>
                        <span className="text-primary">
                          ¥{parseFloat(record.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {record.phone && (
                        <div className="flex justify-between">
                          <span className="font-medium">电话：</span>
                          <span>{record.phone}</span>
                        </div>
                      )}
                      {record.notes && (
                        <div className="flex justify-between">
                          <span className="font-medium">备注：</span>
                          <span>{record.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="pt-2 font-medium text-lg flex justify-between border-t">
                  <span>总计金额：</span>
                  <span className="text-primary">
                    ¥{validAmounts.reduce((sum, amount) => sum + amount, 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
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
