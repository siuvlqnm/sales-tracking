"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUser } from '@/lib/authUtils';

interface StoreSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function StoreSelector({ value, onChange, className }: StoreSelectorProps) {
  const user = getUser();
  const hasMultipleStores = user?.storeIds && user.storeIds.length > 1;

  if (!hasMultipleStores) return null;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="选择门店" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">全部门店</SelectItem>
        {user?.storeIds.map(storeId => (
          <SelectItem key={storeId} value={storeId}>
            {user.storeNames[storeId]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 