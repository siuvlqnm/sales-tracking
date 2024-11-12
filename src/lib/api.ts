import { getAuthHeader, isTokenExpired, clearAuth } from './authUtils';

export type SalesRecord = {
  id: string;
  user_name: string;
  store_name: string;
  actual_amount: number;
  submit_ts: number;
}

// API 请求基础配置
const baseConfig = {
  headers: {
    'Content-Type': 'application/json',
  }
};

// API 请求包装函数
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // 检查 token 是否过期
  if (isTokenExpired()) {
    clearAuth();
    window.location.href = '/auth';
    throw new Error('登录已过期，请重新登录');
  }

  // 合并认证头
  const headers = {
    ...baseConfig.headers,
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
    
  if (response.status === 401) {
    clearAuth();
    window.location.href = '/auth';
    throw new Error('登录已过期，请重新登录');
  }

  if (!response.ok) {
    throw new Error('请求失败');
  }

  return response;
}

// 认证用户
export async function authenticateUser(trackingId: string): Promise<{token: string}> {
  const response = await fetch('/api/v1/auth', {
    method: 'POST',
    headers: baseConfig.headers,
    body: JSON.stringify({ user_id: trackingId }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || '认证失败');
  }
  
  if (!data.token) {
    throw new Error('未收到有效的 token');
  }

  return data;
}

// 添加一个获取东八区时间戳的辅助函数
function getChinaTimestamp(): number {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })).getTime();
}

// 修改提交销售记录的函数
export async function submitSalesRecords(storeId: string, amounts: number[]) {
  const timestamp = getChinaTimestamp();
  
  const response = await fetchWithAuth('/api/v1/sales/form', {
    method: 'POST',
    body: JSON.stringify({
      store_id: storeId,
      amounts: amounts,
      timestamp
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '提交失败');
  }

  return response.json();
}

// 查询销售记录
interface SalesRecordQuery {
  date?: Date;
  storeId?: string;
}

export async function querySalesRecords(params: SalesRecordQuery = {}): Promise<SalesRecord[]> {
  const queryParams = new URLSearchParams();
  
  if (params.date) {
    // 调整为东八区时间
    const date = new Date(params.date);
    date.setHours(date.getHours() + 8);
    // 转换为 YYYY-MM-DD 格式
    const formatted_date = date.toISOString().split('T')[0];
    queryParams.set('start_date', formatted_date);
    queryParams.set('end_date', formatted_date);
  }
  
  if (params.storeId && params.storeId !== 'all') {
    queryParams.set('store_id', params.storeId);
  }

  const response = await fetchWithAuth(`/api/v1/sales/query?${queryParams.toString()}`);
  return response.json();
}

// Add this type definition before the getChartData function
export type ChartData = {
  dailySales: Array<{ date: string; total: number }>;
  topSalespeople?: Array<{ name: string; total: number }>;
  productPerformance: Array<{ amount: number; count: number }>;
};

// 获取图表数据
export async function getChartData(params: {
  startDate: string;
  endDate: string;
  storeId?: string;
}): Promise<ChartData> {
  try {
    const queryParams = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
    });
    
    if (params.storeId) queryParams.set('store_id', params.storeId);

    const response = await fetchWithAuth(`/api/v1/sales/charts?${queryParams.toString()}`);
    return response.json();
  } catch (error) {
    console.error('获取图表数据过程中发生错误：', error);
    throw new Error('获取图表数据失败，请重试。');
  }
}

// 获取仪表盘数据
export type DashboardData = {
  performance: {
    monthlySales: number;
    monthlyOrders: number;
  };
  recentSales: Array<{
    id: string;
    date: string;
    amount: number;
  }>;
  topSalespeople: Array<{
    name: string;
    sales: number;
  }>;
};

export async function getDashboardData(params: {
  userId?: string;
  storeId?: string | 'all';
}): Promise<DashboardData> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.storeId && params.storeId !== 'all') {
      queryParams.set('store_id', params.storeId);
    }

    const response = await fetchWithAuth(
      `/api/v1/sales/dashboard?${queryParams.toString()}`
    );

    return response.json();
  } catch (error) {
    console.error('获取仪表盘数据过程中发生错误：', error);
    throw new Error('获取仪表盘数据失败，请重试。');
  }
}