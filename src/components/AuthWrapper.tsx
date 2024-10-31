"use client";

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getUser, setUserFromParams, User, clearUser } from '@/lib/userManager';
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
import { authenticateUser } from '@/lib/api';

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
      const user = await authenticateUser(trackingId);
      setUserFromParams(new URLSearchParams(
        `userId=${user.id}&role=${user.role}&name=${user.name}&storeId=${user.storeId}&storeName=${user.storeName}`
      ));
      
      const newUser = getUser();
      if (newUser) {
        setUser(newUser);
        setShowTrackingInput(false);
      } else {
        throw new Error('Failed to set user info');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '认证失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearUser();
    setUser(null);
    setShowTrackingInput(true);
    setTrackingId('');
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
        <DialogContent className="w-[90%] max-w-[425px] sm:w-full">
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
      {user ? (
        <div>
          {children}
          <Button onClick={handleLogout} className="fixed bottom-4 right-4">
            退出
          </Button>
        </div>
      ) : null}
    </>
  );
}
