"use client";

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getUser, setUserFromParams, User } from '@/lib/userManager';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { testSalesperson, testManager } from '@/lib/testData';

// 假设这是你的 Worker URL
// const WORKER_URL = 'localhost:3000';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  const [trackingId, setTrackingId] = useState('');

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      setIsLoading(false);
    } else {
      setShowTrackingInput(true);
      setIsLoading(false);
    }
  }, []);

  const handleTrackingSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 使用测试数据而不是发送 API 请求
      let testUser;
      if (trackingId === 'S001') {
        testUser = testSalesperson;
      } else if (trackingId === 'M001') {
        testUser = testManager;
      } else {
        throw new Error('Invalid tracking ID');
      }

      setUserFromParams(new URLSearchParams(`userId=${testUser.id}&role=${testUser.role}&name=${testUser.name}`));
      const newUser = getUser();
      if (newUser) {
        setUser(newUser);
        setShowTrackingInput(false);
      } else {
        throw new Error('Failed to set user info');
      }
    } catch (error) {
      // setError('获取用户信息失败，请重试。');
      setError(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Alert>
        <AlertDescription>正在验证访问权限...</AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Dialog open={showTrackingInput} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>请输入您的 Tracking ID</DialogTitle>
            <DialogDescription>
              为了验证您的身份，请输入您的 Tracking ID。
            </DialogDescription>
          </DialogHeader>
          <Input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="输入 Tracking ID"
          />
          <DialogFooter>
            <Button onClick={handleTrackingSubmit} disabled={!trackingId}>
              提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {user ? children : null}
    </>
  );
}
