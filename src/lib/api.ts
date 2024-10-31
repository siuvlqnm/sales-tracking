import { User } from './userManager';
// import { testSalesperson, testManager } from './testData';

interface AuthResponse {
  user_id: string;
  user_name: string;
  store_id: string;
  role_id: number;
  store_name: string;
}

export async function authenticateUser(trackingId: string): Promise<User> {
//   if (config.apiMode === 'test') {
//     // 使用测试数据
//     if (trackingId === 'S001') {
//       return testSalesperson;
//     } else if (trackingId === 'M001') {
//       return testManager;
//     }
//     throw new Error('无效的 Tracking ID');
//   }

  // 使用实际 API
  try {
    const response = await fetch(`/api/v1/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: trackingId }),
    });

    if (!response.ok) {
      throw new Error('认证失败');
    }

    const data: AuthResponse = await response.json();
    
    // 将 API 响应转换为 User 类型
    return {
      id: data.user_id,
      name: data.user_name,
      role: data.role_id === 1 ? 'manager' : 'salesperson',
      storeId: data.store_id,
      storeName: data.store_name,
    };
  } catch (error: unknown) {
    throw new Error('获取用户信息失败，请重试。');
  }
} 