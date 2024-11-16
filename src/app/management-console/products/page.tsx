"use client";

import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addProduct, getProducts, updateProduct, updateProductStatus, Product } from '@/lib/adminApi';
import { Switch } from "@/components/ui/switch";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('获取商品列表失败:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newProduct = await addProduct(newProductName);
      setProducts([newProduct, ...products]);
      setShowAddDialog(false);
      setNewProductName('');
    } catch (error) {
      console.error('Failed to add product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSubmitting(true);
    try {
      const updatedProduct = await updateProduct(
        editingProduct.productID,
        newProductName
      );
      setProducts(products.map(p => 
        p.productID === updatedProduct.productID ? updatedProduct : p
      ));
      setShowEditDialog(false);
      setNewProductName('');
      setEditingProduct(null);
    } catch (error) {
      console.error('Failed to update product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (product: Product) => {
    try {
      const newStatus = product.productStatus === 1 ? 2 : 1;
      const updatedProduct = await updateProductStatus(
        product.productID,
        newStatus
      );
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.productID === updatedProduct.productID ? updatedProduct : p
        )
      );
    } catch (error) {
      console.error('Failed to toggle product status:', error);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProductName(product.productName);
    setShowEditDialog(true);
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> 添加商品
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品ID</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  暂无商品
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.productID}>
                  <TableCell className="font-mono">{product.productID}</TableCell>
                  <TableCell>{product.productName}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={product.productStatus === 1}
                        onCheckedChange={() => handleStatusToggle(product)}
                      />
                      <span className={`text-sm ${product.productStatus === 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.productStatus === 1 ? '启用' : '禁用'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 添加商品对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>添加商品</DialogTitle>
              <DialogDescription>
                请输入新商品的名称。
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="商品名称"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '添加中...' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑商品对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>编辑商品</DialogTitle>
              <DialogDescription>
                修改商品名称。
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="商品名称"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingProduct(null);
                  setNewProductName('');
                }}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 