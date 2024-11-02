"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster } from '@/components/ui/toaster';
import { addStore, addUser, assignRole, getStores, getUsers } from '@/lib/adminApi';
import type { Store, User } from '@/lib/adminApi';
// import { useToast } from '@/components/ui/use-toast';

export default function AdminPage() {
  const router = useRouter();
  // const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 检查管理员认证
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/admin/login');
    }
  }, [router]);

  // 加载数据
  useEffect(() => {
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
  }, [refreshKey]);

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
      await assignRole(selectedUser, selectedStore, parseInt(selectedRole));
      setSelectedUser('');
      setSelectedStore('');
      setSelectedRole('');
      refreshData();
    } catch (error) {
      // 错误已在 API 函数中处理
      console.error('分配角色失败:', error);
    } finally {
      setLoading(false);
    }
  };

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
                <Select value={selectedUser} onValueChange={setSelectedUser}>
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

                <Select value={selectedStore} onValueChange={setSelectedStore}>
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

                <Select value={selectedRole} onValueChange={setSelectedRole}>
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
                  disabled={loading || !selectedUser || !selectedStore || !selectedRole}
                >
                  分配角色
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </>
  );
} 