import { format, subDays } from 'date-fns';

export interface SalesRecord {
  id: number;
  customer: string;
  amount: string;
  date: string;
}

export interface PerformanceData {
  monthlySales: number;
  monthlyOrders: number;
}

export interface Salesperson {
  name: string;
  sales: string;
}

// 添加新的接口定义
export interface TestUser {
  name: string;
  id: string;
  role: string;
}

// 生成随机销售记录
export function generateSalesRecords(count: number): SalesRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    customer: `客户${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    amount: (Math.random() * 10000 + 1000).toFixed(2),
    date: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd')
  }));
}

// 生成随机业绩数据
export function generatePerformanceData(): PerformanceData {
  return {
    monthlySales: Math.floor(Math.random() * 1000000 + 100000),
    monthlyOrders: Math.floor(Math.random() * 100 + 20)
  };
}

// 生成随机销售人员排名
export function generateTopSalespeople(count: number): Salesperson[] {
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  return Array.from({ length: count }, () => ({
    name: names[Math.floor(Math.random() * names.length)],
    sales: (Math.random() * 500000 + 100000).toFixed(2)
  })).sort((a, b) => Number(b.sales) - Number(a.sales));
}

// 生成随机团队业绩数据
export function generateTeamPerformance(): PerformanceData {
  return {
    monthlySales: Math.floor(Math.random() * 10000000 + 1000000),
    monthlyOrders: Math.floor(Math.random() * 1000 + 200)
  };
}

// 添加测试销售人员和店长信息
export const testSalesperson: TestUser = {
  name: "张三",
  id: "S001",
  role: "salesperson"
};

export const testManager: TestUser = {
  name: "李四",
  id: "M001",
  role: "manager"
};
