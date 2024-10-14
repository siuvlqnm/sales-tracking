import React from 'react';
import SalesForm from '@/components/SalesForm';
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        销售数据提交
      </h1>
      <div className="w-full max-w-md">
        <SalesForm />
      </div>
      <Toaster />
    </main>
  );
}
