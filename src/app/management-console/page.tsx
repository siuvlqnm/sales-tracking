"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster } from '@/components/ui/toaster';
import { addStore, addUser, assignRole, getStores, getUsers, assignStore, verifyAdminToken } from '@/lib/adminApi';
import type { Store, User } from '@/lib/adminApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>({});

  // 检查管理员认证
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await verifyAdminToken();
        if (!isValid) {
          router.push('/management-console/login');
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error('验证失败:', error);
        router.push('/management-console/login');
      }
    };

    checkAuth();
  }, [router]);

  // 加载数据
  useEffect(() => {
    if (!isLoading) {
      const fetchData = async () => {
        try {
          const [storesData, usersData] = await Promise.all([
            getStores(),
            getUsers()
          ]);
          setStores(storesData);
          setUsers(usersData);
        } catch (error) {
          console.error('加载数据失败:', error);
          // 如果是认证错误，跳转到登录页
          if (error instanceof Error && 
              (error.message.includes('未登录') || 
               error.message.includes('未授权') || 
               error.message.includes('无效令牌'))) {
            router.push('/management-console/login');
          }
        }
      };
      fetchData();
    }
  }, [refreshKey, isLoading, router]);

  // 刷新数据
  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 添加门店
  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addStore(newStoreName);
      setNewStoreName('');
      refreshData();
    } catch (error) {
      console.error('添加门店失败:', error);
      // 错误已在 API 函数中处理
    } finally {
      setLoading(false);
    }
  };

  // 添加员工
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addUser(newUserName);
      setNewUserName('');
      refreshData();
    } catch (error) {
      // 错误已在 API 函数中处理
      console.error('添加员工失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // Move handleRoleChange inside the component
  const handleRoleChange = async (userId: string, roleId: number) => {
    try {
      await assignRole(userId, roleId);
      refreshData(); // Now has access to refreshData
    } catch (error) {
      console.error('修改角色失败:', error);
    }
  };

  const handleStoreChange = async (userId: string, storeIds: string[]) => {
    try {
      await assignStore(userId, storeIds);
      refreshData();
    } catch (error) {
      console.error('修改门店分配失败:', error);
    }
  };

  // 如果正在加载，显示加载指示器
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 渲染主要内容
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">系统管理</h1>
          <Button onClick={refreshData} variant="outline">
            刷新数据
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>添加门店</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStore} className="space-y-4">
                <Input
                  placeholder="门店名称"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !newStoreName}>
                  添加门店
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>添加员工</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <Input
                  placeholder="员工姓名"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !newUserName}>
                  添加员工
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 添加员工列表展示 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>员工列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>员工姓名</TableHead>
                  <TableHead>员工ID</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>所属门店</TableHead>
                  <TableHead>角色</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.user_name}</TableCell>
                    <TableCell className="font-mono">{user.user_id}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString('zh-CN')}</TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {user.stores?.length 
                              ? `${user.stores.length} 个门店`
                              // ? `${user.stores.map(s => s.store_name).join(', ')}`
                              : "选择门店"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <div className="p-2 space-y-2">
                            <Input
                              placeholder="搜索门店..."
                              value={searchQueries[user.user_id] || ''}
                              onChange={(e) => 
                                setSearchQueries(prev => ({
                                  ...prev,
                                  [user.user_id]: e.target.value
                                }))
                              }
                              className="mb-2"
                            />
                            <div className="max-h-[200px] overflow-y-auto space-y-1">
                              {stores
                                .filter(store => {
                                  const query = searchQueries[user.user_id]?.toLowerCase() || '';
                                  return store.store_name.toLowerCase().includes(query);
                                })
                                .map((store) => {
                                  const isSelected = user.stores?.some(
                                    s => s.store_id === store.store_id
                                  ) || false;
                                  
                                  return (
                                    <div
                                      key={store.store_id}
                                      className={cn(
                                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent",
                                        isSelected ? "bg-accent" : ""
                                      )}
                                      onClick={() => {
                                        const currentStoreIds = user.stores?.map(s => s.store_id) || [];
                                        const newStoreIds = isSelected
                                          ? currentStoreIds.filter(id => id !== store.store_id)
                                          : [...currentStoreIds, store.store_id];
                                        handleStoreChange(user.user_id, newStoreIds);
                                      }}
                                    >
                                      <div className="w-4 h-4 border rounded flex items-center justify-center">
                                        {isSelected && <Check className="h-3 w-3" />}
                                      </div>
                                      <span>{store.store_name}</span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={user.role_type?.toString() || ''}
                        onValueChange={(value) => handleRoleChange(user.user_id, parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {user.role_type === 1 ? '店长' : 
                             user.role_type === 2 ? '销售' : 
                             '未分配'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">店长</SelectItem>
                          <SelectItem value="2">销售</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
      <Toaster />
    </>
  );
} 