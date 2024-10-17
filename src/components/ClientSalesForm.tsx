"use client";

import { useSearchParams } from 'next/navigation';
import SalesForm from './SalesForm';

export default function ClientSalesForm() {
  const searchParams = useSearchParams();
  
  return <SalesForm searchParams={searchParams} />;
}
