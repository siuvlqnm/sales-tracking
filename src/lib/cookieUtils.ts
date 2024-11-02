export interface User {
  id: string;
  name: string;
  role: 'manager' | 'salesperson';
  storeId: string;
  storeName: string;
}

export function getUser(): User | null {
  if (typeof document === 'undefined') return null;
  
  const userCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('user='));
    
  if (userCookie) {
    try {
      return JSON.parse(userCookie.split('=')[1]);
    } catch (e) {
      console.error('解析用户信息失败:', e);
      return null;
    }
  }
  return null;
} 