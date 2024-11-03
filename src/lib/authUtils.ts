export interface User {
  id: string;
  name: string;
  role: 'manager' | 'salesperson';
  storeIds: string[];
  storeNames: { [key: string]: string };
}

// base64url 解码函数
function base64UrlDecode(str: string): string {
  // 还原 base64url 编码
  const base64 = str
    .replace(/-/g, '+')
    .replace(/_/g, '/');
    
  // 解码 base64 为字节数组
  const binStr = atob(base64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  
  // 将字节数组解码为 UTF-8 字符串
  return new TextDecoder().decode(bytes);
}

// 检查 token 是否过期
export function isTokenExpired(): boolean {
  const token = localStorage.getItem('token');
  if (!token) return true;

  try {
    const [, payload] = token.split('.');
    if (!payload) return true;

    const decodedPayload = JSON.parse(base64UrlDecode(payload));
    return decodedPayload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// 从 JWT token 中解析用户信息
export function getUser(): User | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const decodedPayload = JSON.parse(base64UrlDecode(payload));
    
    // 检查 token 是否过期
    if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
      clearAuth();
      // 移除自动重定向
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
  if (!token) {
    console.error('Attempting to set empty token');
    return;
  }
  localStorage.setItem('token', token);
}

// 清除认证信息
export function clearAuth(): void {
  localStorage.removeItem('token');
}

// 获取认证头
export function getAuthHeader(): { Authorization: string } | Record<string, never> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
} 