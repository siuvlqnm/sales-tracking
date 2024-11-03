"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster } from '@/components/ui/toaster';
import { addStore, addUser, assignRole, getStores, getUsers, assignStore } from '@/lib/adminApi';
import type { Store, User } from '@/lib/adminApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { useToast } from '@/components/ui/use-toast';

export default function AdminPage() {
  const router = useRouter();
  // const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [roleAssignment, setRoleAssignment] = useState({
    userId: '',
    roleId: '',
  });
  const [storeAssignment, setStoreAssignment] = useState({
    userId: '',
    storeId: '',
  });

  // 检查管理员认证
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/admin/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // 加载数据
  useEffect(() => {
    if (!isLoading) {  // 只在认证完成后加载数据
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
        }
      };
      fetchData();
    }
  }, [refreshKey, isLoading]);  // 添加 isLoading 作为依赖

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

  // 分配角色
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await assignRole(
        roleAssignment.userId, 
        parseInt(roleAssignment.roleId)
      );
      setRoleAssignment({ userId: '', roleId: '' });
      refreshData();
    } catch (error) {
      console.error('分配角色失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 分配门店
  const handleAssignStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await assignStore(
        storeAssignment.userId,
        storeAssignment.storeId
      );
      setStoreAssignment({ userId: '', storeId: '' });
      refreshData();
    } catch (error) {
      console.error('分配门店失败:', error);
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

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>分配角色</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignRole} className="space-y-4">
                <Select 
                  value={roleAssignment.userId} 
                  onValueChange={(value) => setRoleAssignment(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择员工" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={roleAssignment.roleId}
                  onValueChange={(value) => setRoleAssignment(prev => ({ ...prev, roleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">店长</SelectItem>
                    <SelectItem value="2">销售</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="submit"
                  disabled={loading || !roleAssignment.userId || !roleAssignment.roleId}
                >
                  分配角色
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>分配门店</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignStore} className="space-y-4">
                <Select 
                  value={storeAssignment.userId}
                  onValueChange={(value) => setStoreAssignment(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择员工" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={storeAssignment.storeId}
                  onValueChange={(value) => setStoreAssignment(prev => ({ ...prev, storeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择门店" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.store_id} value={store.store_id}>
                        {store.store_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="submit"
                  disabled={loading || !storeAssignment.userId || !storeAssignment.storeId}
                >
                  分配门店
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
                      {user.stores?.map(store => store.store_name).join(', ') || '未分配'}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={user.role_id?.toString() || ''}
                        onValueChange={(value) => handleRoleChange(user.user_id, parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {user.role_id === 1 ? '店长' : 
                             user.role_id === 2 ? '销售' : 
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