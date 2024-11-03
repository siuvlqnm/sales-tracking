export interface User {
  id: string;
  name: string;
  role: 'manager' | 'salesperson';
  storeIds: string[];
  storeNames: { [key: string]: string };
}

// 从 JWT token 中解析用户信息
export function getUser(): User | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const decodedPayload = JSON.parse(atob(payload));
    
    // 检查 token 是否过期
    if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
      clearAuth();
      return null;
    }

    return decodedPayload.user;
  } catch (e) {
    console.error('解析用户信息失败:', e);
    return null;
  }
}

// 保存认证信息
export function setAuth(token: string): void {
  localStorage.setItem('token', token);
}

// 清除认证信息
export function clearAuth(): void {
  localStorage.removeItem('token');
}

// 获取认证头
export function getAuthHeader(): { Authorization: string } | {} {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
} 