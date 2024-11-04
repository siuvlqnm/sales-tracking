export interface User {
  id: string;
  name: string;
  role: 'manager' | 'salesperson';
  storeIds: string[];
  storeNames: { [key: string]: string };
}

// base64url 解码函数
function base64UrlDecode(str: string): string {
  try {
    // 1. 补充 base64 填充
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // 2. 直接解码 base64
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    console.error('Base64URL decode error:', e);
    throw e;
  }
}

// 检查 token 是否过期
export function isTokenExpired(): boolean {
  try {
    const token = localStorage.getItem('token');
    if (!token) return true;

    const [, payload] = token.split('.');
    if (!payload) return true;

    const decodedPayload = JSON.parse(base64UrlDecode(payload));
    return decodedPayload.exp * 1000 <= Date.now();
  } catch (e) {
    console.error('Token expiry check failed:', e);
    return true;
  }
}

// 从 JWT token 中解析用户信息
export function getUser(): User | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    const payload = base64UrlDecode(parts[1]);
    const decodedPayload = JSON.parse(payload);
    
    // 检查 token 是否过期
    if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
      console.log('Token expired:', new Date(decodedPayload.exp * 1000));
      clearAuth();
      return null;
    }

    // 验证用户数据结构
    if (!decodedPayload.user || !decodedPayload.user.id) {
      console.error('Invalid user data in token');
      return null;
    }

    return decodedPayload.user;
  } catch (e) {
    console.error('Failed to parse user from token:', e);
    clearAuth();
    return null;
  }
}

// 保存认证信息
export function setAuth(token: string): void {
  if (!token) {
    console.error('Attempting to set empty token');
    return;
  }
  
  try {
    // 验证 token 格式
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // 尝试解析确保 token 有效
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (!payload.user || !payload.exp) {
      throw new Error('Invalid token payload');
    }

    localStorage.setItem('token', token);
    console.log('Token successfully saved');
  } catch (e) {
    console.error('Failed to save token:', e);
    throw e;
  }
}

// 清除认证信息
export function clearAuth(): void {
  localStorage.removeItem('token');
  console.log('Auth cleared');
}

// 获取认证头
export function getAuthHeader(): { Authorization: string } | Record<string, never> {
  const token = localStorage.getItem('token');
  if (!token) return {};
  
  try {
    // 简单验证 token 格式
    if (token.split('.').length !== 3) {
      console.error('Invalid token format in headers');
      clearAuth();
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  } catch (e) {
    console.error('Failed to get auth header:', e);
    return {};
  }
} 