"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUserStores, type Store } from '@/lib/authUtils';

interface StoreSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function StoreSelector({ value, onChange, className }: StoreSelectorProps) {
  const [stores, setStores] = React.useState<Store[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getUserStores()
      .then((stores) => setStores(stores ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!stores || stores.length <= 1) return null;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="选择门店" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">全部门店</SelectItem>
        {stores.map(store => (
          <SelectItem key={store.store_id} value={store.store_id}>
            {store.store_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 