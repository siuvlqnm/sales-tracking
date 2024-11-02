import type { User } from './cookieUtils';
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

export type SalesRecord = {
  id: string;
  user_name: string;
  store_name: string;
  actual_amount: number;
  submission_time: string;
}

// 认证用户
export async function authenticateUser(trackingId: string): Promise<User> {
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
  try {
    // 获取北京时间
    const now = new Date();
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const timestamp = beijingTime.toISOString();

    const response = await fetch(`/api/v1/sales/form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        store_id: storeId,
        amounts: amounts,
        timestamp: timestamp
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

export interface ChartData {
  dailySales: { date: string; total: number }[];
  topSalespeople: { name: string; total: number }[];
  productPerformance: { amount: number; count: number }[];
}

export async function getChartData(params: {
  startDate: string;
  endDate: string;
  userId?: string;
  role?: string;
}): Promise<ChartData> {
  try {
    const queryParams = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
    });
    
    if (params.userId) {
      queryParams.set('user_id', params.userId);
    }
    if (params.role) {
      queryParams.set('role', params.role);
    }

    const response = await fetch(
      `/api/v1/sales/charts?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取图表数据失败');
    }

    return await response.json();
  } catch (error) {
    console.error('获取图表数据过程中发生错误：', error);
    throw new Error('获取图表数据失败，请重试。');
  }
}

export interface DashboardData {
  performance: {
    monthlySales: number;
    monthlyOrders: number;
  };
  recentSales: {
    id: string;
    user_name: string;
    store_name: string;
    amount: number;
    date: string;
  }[];
  topSalespeople: {
    name: string;
    sales: number;
  }[];
}

export async function getDashboardData(params: {
  userId?: string;
  storeId?: string;
}): Promise<DashboardData> {
  try {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.set('user_id', params.userId);
    if (params.storeId) queryParams.set('store_id', params.storeId);

    const response = await fetch(
      `/api/v1/sales/dashboard?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取数据失败');
    }

    return await response.json();
  } catch (error) {
    console.error('获取仪表盘数据过程中发生错误：', error);
    throw new Error('获取仪表盘数据失败，请重试。');
  }
} 