import { getAuthHeader } from './authUtils';

export type SalesRecord = {
  id: string;
  user_name: string;
  store_name: string;
  actual_amount: number;
  submission_time: string;
}

// 认证用户
export async function authenticateUser(trackingId: string): Promise<{token: string}> {
  try {
    const response = await fetch(`/api/v1/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: trackingId }),
    });

    if (!response.ok) throw new Error('认证失败');

    const data = await response.json();
    return { token: data.token };
  } catch (error) {
    console.error('认证过程中发生错误：', error);
    throw new Error('获取用户信息失败，请重试。');
  }
}

// 修改其他 API 调用函数，使用 getAuthHeader
export async function submitSalesRecords(
  userId: string,
  storeId: string,
  amounts: number[]
): Promise<void> {
  try {
    const response = await fetch(`/api/v1/sales/form`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        user_id: userId,
        store_id: storeId,
        amounts: amounts,
        timestamp: new Date().toISOString()
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

interface SalesRecordQuery {
  date?: Date;
  salesperson?: string;
  storeId?: string;
}

// 获取销售记录
export async function querySalesRecords(params: SalesRecordQuery = {}): Promise<SalesRecord[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.date) {
      queryParams.set('date', params.date.toISOString().split('T')[0]);
    }
    if (params.salesperson) {
      queryParams.set('salesperson', params.salesperson);
    }
    if (params.storeId && params.storeId !== 'all') {
      queryParams.set('store_id', params.storeId);
    }

    const response = await fetch(`/api/v1/sales?${queryParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '查询失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching records:', error);
    throw new Error('获取销售记录失败，请重试');
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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
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
  storeId?: string;
}): Promise<ChartData> {
  try {
    const queryParams = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
    });
    
    if (params.userId) queryParams.set('user_id', params.userId);
    if (params.role) queryParams.set('role', params.role);
    if (params.storeId) queryParams.set('store_id', params.storeId);

    const response = await fetch(
      `/api/v1/sales/charts?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
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
  storeId?: string | 'all';
}): Promise<DashboardData> {
  try {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.set('user_id', params.userId);
    if (params.storeId && params.storeId !== 'all') {
      queryParams.set('store_id', params.storeId);
    }

    const response = await fetch(
      `/api/v1/sales/dashboard?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
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