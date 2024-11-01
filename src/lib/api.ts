import { User } from './userManager';
// import { config } from './config';
// import { testSalesperson, testManager } from './testData';

// API 响应类型定义
interface AuthResponse {
  user_id: string;
  user_name: string;
  store_id: string;
  role_id: number;
  store_name: string;
}

interface SalesRecord {
  id: number;
  user_id: string;
  user_name: string;
  store_id: string;
  store_name: string;
  actual_amount: number;
  submission_time: string;
}

// 认证用户
export async function authenticateUser(trackingId: string): Promise<User> {
//   if (config.apiMode === 'test') {
//     if (trackingId === 'S001') return testSalesperson;
//     if (trackingId === 'M001') return testManager;
//     throw new Error('无效的 Tracking ID');
//   }

  try {
    const response = await fetch(`/api/v1/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: trackingId }),
    });

    if (!response.ok) throw new Error('认证失败');

    const data: AuthResponse = await response.json();
    return {
      id: data.user_id,
      name: data.user_name,
      role: data.role_id === 1 ? 'manager' : 'salesperson',
      storeId: data.store_id,
      storeName: data.store_name,
    };
  } catch (error) {
    console.error('认证过程中发生错误：', error);
    throw new Error('获取用户信息失败，请重试。');
  }
}

// 提交销售记录
export async function submitSalesRecords(
  userId: string,
  storeId: string,
  amounts: number[]
): Promise<void> {
//   if (config.apiMode === 'test') {
//     console.log('Test mode: Submitting sales records', { userId, storeId, amounts });
//     return;
//   }

  try {
    const response = await fetch(`/api/v1/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        store_id: storeId,
        actual_amount: amounts.reduce((sum, amount) => sum + amount, 0),
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '提交失败');
    }
  } catch (error) {
    console.error('提交销售记录过程中发生错误：', error);
    throw new Error('提交销售记录失败，请重试。');
  }
}

// 查询销售记录
export async function querySalesRecords(params: {
  userId?: string;
  storeId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SalesRecord[]> {
//   if (config.apiMode === 'test') {
//     return [
//       {
//         id: 1,
//         user_id: 'S001',
//         user_name: '测试销售员',
//         store_id: 'STORE001',
//         store_name: '测试门店1',
//         actual_amount: 1000,
//         submission_time: new Date().toISOString(),
//       },
//       // 更多测试数据...
//     ];
//   }

  try {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.set('user_id', params.userId);
    if (params.storeId) queryParams.set('store_id', params.storeId);
    if (params.startDate) queryParams.set('start_date', params.startDate);
    if (params.endDate) queryParams.set('end_date', params.endDate);

    const response = await fetch(
      `/api/v1/sales/query?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '查询失败');
    }

    return await response.json();
  } catch (error) {
    console.error('查询销售记录过程中发生错误：', error);
    throw new Error('查询销售记录失败，请重试。');
  }
}

// 获取销售统计
export async function getSalesStatistics(params: {
  storeId: string;
  startDate: string;
  endDate: string;
}): Promise<{
  totalAmount: number;
  recordCount: number;
  dailyStats: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
}> {
//   if (config.apiMode === 'test') {
//     return {
//       totalAmount: 10000,
//       recordCount: 5,
//       dailyStats: [
//         {
//           date: new Date().toISOString().split('T')[0],
//           amount: 2000,
//           count: 1,
//         },
//         // 更多测试数据...
//       ],
//     };
//   }

  try {
    const queryParams = new URLSearchParams({
      store_id: params.storeId,
      start_date: params.startDate,
      end_date: params.endDate,
    });

    const response = await fetch(
      `/api/v1/sales/statistics?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取统计数据失败');
    }

    return await response.json();
  } catch (error) {
    console.error('获取销售统计过程中发生错误：', error);
    throw new Error('获取销售统计失败，请重试。');
  }
} 