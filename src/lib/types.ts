export interface User {
  id: string;
  name: string;
  role: 'manager' | 'salesperson';
  storeId: string;
  storeName: string;
} 