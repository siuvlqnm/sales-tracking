export interface User {
  id: string;
  name: string;
  role: 'manager' | 'salesperson';
  storeIds: string[];
  storeNames: { [key: string]: string };
}

interface JWTPayload {
  user: User;
  exp: number;
}

class TokenService {
  private static instance: TokenService;
  private readonly storageKey = 'token';
  private readonly secret = '2b7e151628aed2a6abf7158809cf4f3c';

  private constructor() {}

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  private base64UrlDecode(str: string): string {
    try {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) {
        str += '=';
      }
      return atob(str);
    } catch (e) {
      console.error('Base64URL decode error:', e);
      throw e;
    }
  }

  private async verifyToken(token: string): Promise<JWTPayload> {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }

    // 解码头部和载荷
    const header = JSON.parse(this.base64UrlDecode(headerB64));
    const payload = JSON.parse(this.base64UrlDecode(payloadB64));

    // 检查算法
    if (header.alg !== 'HS256') {
      throw new Error('Unsupported algorithm');
    }

    // 验证签名
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(
      atob(this.base64UrlDecode(signatureB64)), 
      c => c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    return payload as JWTPayload;
  }

  private isExpired(exp: number): boolean {
    return exp * 1000 <= Date.now();
  }

  async setToken(token: string): Promise<void> {
    if (!token) {
      throw new Error('Empty token');
    }

    try {
      const payload = await this.verifyToken(token);
      if (this.isExpired(payload.exp)) {
        throw new Error('Token expired');
      }
      localStorage.setItem(this.storageKey, token);
    } catch (error) {
      console.error('Token validation failed:', error);
      this.clearToken();
      throw error;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.storageKey);
  }

  async getUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = await this.verifyToken(token);
      if (this.isExpired(payload.exp)) {
        this.clearToken();
        return null;
      }
      return payload.user;
    } catch (error) {
      console.error('Failed to get user:', error);
      this.clearToken();
      return null;
    }
  }

  getAuthHeader(): { Authorization: string } | Record<string, never> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const [, payload] = token.split('.');
      const decodedPayload = JSON.parse(this.base64UrlDecode(payload));
      return !this.isExpired(decodedPayload.exp);
    } catch {
      return false;
    }
  }
}

// 导出单例实例
const tokenService = TokenService.getInstance();

// 导出简化的公共接口
export const setAuth = (token: string) => tokenService.setToken(token);
export const getUser = () => tokenService.getUser();
export const clearAuth = () => tokenService.clearToken();
export const getAuthHeader = () => tokenService.getAuthHeader();
export const isTokenExpired = () => !tokenService.isAuthenticated();