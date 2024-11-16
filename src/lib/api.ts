import { getAuthHeader, isTokenExpired, clearAuth } from './authUtils';

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

export type formSalesRecord = {
  amount: string;
  customerName: string;
  productID: string;
}

// 修改提交销售记录的函数
export async function submitSalesRecords(storeId: string, records: formSalesRecord[]) {
  const timestamp = getChinaTimestamp();
  
  // 过滤出有效记录
  const validRecords = records.filter(record => 
    record.amount && record.customerName && record.productID
  ).map(record => ({
    ...record,
    amount: parseFloat(record.amount), // 确保金额是数字
  }));
  
  const response = await fetchWithAuth('/api/v1/sales/form', {
    method: 'POST',
    body: JSON.stringify({
      store_id: storeId,
      records: validRecords,
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
  storeID?: string;
}

export type SalesRecord = {
  id: string;
  userName: string;
  storeName: string;
  actualAmount: number;
  submitTs: number;
  customerName: string;
  phone?: string;
  productName: string;
  notes?: string;
  orderNo: string;
}

interface ApiSalesRecord {
  id: string;
  user_name: string;
  store_name: string;
  actual_amount: number;
  submit_ts: number;
  customer_name: string;
  phone?: string;
  product_name: string;
  notes?: string;
  order_no: string;
}

// 添加数据转换函数
function convertApiSalesRecord(ApiSalesRecord: ApiSalesRecord): SalesRecord {
  return {
    id: ApiSalesRecord.id,
    userName: ApiSalesRecord.user_name,
    storeName: ApiSalesRecord.store_name,
    actualAmount: ApiSalesRecord.actual_amount,
    submitTs: ApiSalesRecord.submit_ts,
    customerName: ApiSalesRecord.customer_name,
    phone: ApiSalesRecord.phone,
    productName: ApiSalesRecord.product_name,
    notes: ApiSalesRecord.notes,
    orderNo: ApiSalesRecord.order_no,
  };
}

export async function querySalesRecords(params: SalesRecordQuery = {}): Promise<SalesRecord[]> {
  const queryParams = new URLSearchParams();
  
  if (params.date) {
    // 转换为东八区时间戳
    const date = new Date(params.date);
    // 设置为当天的开始时间 (00:00:00)
    const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    startTime.setHours(startTime.getHours() + 8);
    const startTs = startTime.getTime();
    
    // 设置为当天的结束时间 (23:59:59)
    const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    endTime.setHours(endTime.getHours() + 8);
    const endTs = endTime.getTime();
    
    queryParams.set('startTs', startTs.toString());
    queryParams.set('endTs', endTs.toString());
  }
  
  if (params.storeID && params.storeID !== 'all') {
    queryParams.set('storeID', params.storeID);
  }

  const response = await fetchWithAuth(`/api/v1/sales/query?${queryParams.toString()}`);
  const apiRecords = await response.json();
  return apiRecords.map(convertApiSalesRecord);
}

// 添加删除销售记录的函数
export async function deleteSalesRecord(recordId: string, reason: string): Promise<void> {
  const response = await fetchWithAuth('/api/v1/sales/query', {
    method: 'DELETE',
    body: JSON.stringify({
      recordID: recordId,
      reason: reason
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '删除失败');
  }
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
      queryParams.set('storeID', params.storeId);
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

export type Product = {
  productID: string;
  productName: string;
}

// 获取商品列表
export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetchWithAuth('/api/v1/sales/products');
    if (!response.ok) {
      console.error('Failed to fetch products');
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}