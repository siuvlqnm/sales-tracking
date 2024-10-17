export type UserRole = 'salesperson' | 'manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

// 这里应该是从实际的认证系统获取用户信息
export function getCurrentUser(): User | null {
  // 模拟用户，实际应用中应该从服务器获取
  return {
    id: '1',
    name: '张三',
    // role: 'salesperson'
    role: 'manager'
  };
}
