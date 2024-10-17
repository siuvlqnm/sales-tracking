import { Suspense } from 'react';
import ClientSalesForm from '@/components/ClientSalesForm';

export default function SalesFormPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientSalesForm />
    </Suspense>
  );
}
