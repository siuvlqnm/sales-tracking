import { generateId } from './snowflake';
import { toast } from '@/components/ui/use-toast';
import { z } from 'zod'; // 使用 Zod 进行数据验证

export interface Store {
  store_id: string;
  store_name: string;
  created_at: string;
}

export interface User {
  user_id: string;
  user_name: string;
  created_at: string;
  role_type: number;
  stores?: Array<{
    store_id: string;
    store_name: string;
  }>;
}

export interface StoreAssignment {
  id: number;
  user_id: string;
  store_id: string;
  created_at: string;
}

// API 请求基础配置
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminToken');
  }
  return null;
};

const getBaseHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});

// 验证规则
const loginSchema = z.object({
  username: z.string()
    .min(4, '用户名至少4个字符')
    .max(20, '用户名不能超过20个字符'),
  password: z.string()
    .min(6, '密码至少6个字符')
    .max(50, '密码不能超过50个字符')
});

const storeSchema = z.object({
  store_name: z.string()
    .min(2, '门店名称至少2个字符')
    .max(50, '门店名称不能超过50个字符')
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/, '门店名称只能包含中文、英文、数字和空格')
});

const userSchema = z.object({
  user_name: z.string()
    .min(2, '员工姓名至少2个字符')
    .max(20, '员工姓名不能超过20个字符')
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9]+$/, '员工姓名只能包含中文、英文和数字')
});

const roleSchema = z.object({
  user_id: z.string().min(1, '请选择员工'),
  role_type: z.number().int().min(1).max(2, '无效的角色ID')
});

// 管理员登录
export async function adminLogin(username: string, password: string) {
  try {
    // 验证输入
    loginSchema.parse({ username, password });

    const response = await fetch('/api/v1/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '登录失败');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error;
  }
}

// 验证管理员 token
export async function verifyAdminToken(): Promise<boolean> {
  try {
    const token = localStorage.getItem('adminToken');
    const expires = localStorage.getItem('adminTokenExpires');

    if (!token || !expires) {
      clearAdminAuth();
      return false;
    }

    // 检查是否过期
    if (Date.now() > Number(expires)) {
      clearAdminAuth();
      return false;
    }

    const response = await fetch('/api/v1/admin/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      clearAdminAuth();
      return false;
    }

    return true;
  } catch {
    clearAdminAuth();
    return false;
  }
}

// 添加清除管理员认证的辅助函数
export function clearAdminAuth() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminTokenExpires');
  // 使用 window.location 确保强制跳转
  window.location.href = '/management-console/login';
}

// 添加门店
export async function addStore(storeName: string): Promise<Store> {
  try {
    // 验证输入
    storeSchema.parse({ store_name: storeName });

    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('未登录');

    const response = await fetch('/api/v1/admin/stores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        store_id: generateId(),
        store_name: storeName.trim(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '添加门店失败');
    }

    const data = await response.json();
    toast({
      title: "成功",
      description: "门店添加成功",
    });
    return data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '添加门店失败',
      variant: "destructive",
    });
    throw error;
  }
}

// 获取所有门店
export async function getStores(): Promise<Store[]> {
  try {
    const response = await fetch('/api/v1/admin/stores', {
      headers: getBaseHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取门店列表失败');
    }

    return await response.json();
  } catch (error) {
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '获取门店列表失败',
      variant: "destructive",
    });
    throw error;
  }
}

// 添加员工
export async function addUser(userName: string): Promise<User> {
  try {
    // Use schema instead of validateUserName
    userSchema.parse({ user_name: userName });

    const response = await fetch('/api/v1/admin/users', {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({
        user_id: generateId(),
        user_name: userName.trim(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '添加员工失败');
    }

    const data = await response.json();
    toast({
      title: "成功",
      description: "员工添加成功",
    });
    return data;
  } catch (error) {
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '添加员工失败',
      variant: "destructive",
    });
    throw error;
  }
}

// 获取所有员工
export async function getUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/v1/admin/users', {
      headers: getBaseHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取员工列表失败');
    }

    return await response.json();
  } catch (error) {
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '获取员工列表失败',
      variant: "destructive",
    });
    throw error;
  }
}

// 修改或分配角色
export async function assignRole(
  userId: string,
  roleId: number
): Promise<User> {
  try {
    roleSchema.parse({ user_id: userId, role_type: roleId });

    const response = await fetch('/api/v1/admin/roles', {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({
        user_id: userId,
        role_type: roleId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '角色更新失败');
    }

    const data = await response.json();
    toast({
      title: "成功",
      description: "角色更新成功",
    });
    return data;
  } catch (error) {
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '角色更新失败',
      variant: "destructive",
    });
    throw error;
  }
}

// 更新门店分配
export async function assignStore(
  userId: string,
  storeIds: string[]
): Promise<User> {
  try {
    // 修改验证规则，移除 .min(1) 限制
    z.object({
      user_id: z.string().min(1, '请选择员工'),
      // store_ids: z.array(z.string()).min(1, '请至少选择一个门店')
      store_ids: z.array(z.string()) // 允许空数组
    }).parse({ user_id: userId, store_ids: storeIds });

    const response = await fetch('/api/v1/admin/stores/assign', {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({
        user_id: userId,
        store_ids: storeIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '门店分配失败');
    }

    const data = await response.json();
    toast({
      title: "成功",
      description: "门店分配已更新",
    });
    return data;
  } catch (error) {
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '门店分配失败',
      variant: "destructive",
    });
    throw error;
  }
}

// 添加类型定义
export interface Product {
  productID: string;
  productName: string;
  productStatus: number;
}

interface ApiProduct {
  product_id: string;
  product_name: string;
  product_status: number;
}

// 添加数据转换函数
function convertApiProduct(apiProduct: ApiProduct): Product {
  return {
    productID: apiProduct.product_id,
    productName: apiProduct.product_name,
    productStatus: apiProduct.product_status
  };
}

// 添加商品验证规则
const productSchema = z.object({
  productName: z.string()
    .min(2, '商品名称至少2个字符')
    .max(50, '商品名称不能超过50个字符')
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/, '商品名称只能包含中文、英文、数字和空格')
});

// 添加商品 API
export async function addProduct(productName: string): Promise<Product> {
  try {
    productSchema.parse({ productName: productName });

    const response = await fetch('/api/v1/admin/products', {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({
        productID: generateId(),
        productName: productName.trim(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '添加商品失败');
    }

    const data = await response.json();
    toast({
      title: "成功",
      description: "商品添加成功",
    });
    return data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '添加商品失败',
      variant: "destructive",
    });
    throw error;
  }
}

// 获取所有商品
export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch('/api/v1/admin/products', {
      headers: getBaseHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取商品列表失败');
    }

    const apiProducts = await response.json();
    return apiProducts.map(convertApiProduct);
  } catch (error) {
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '获取商品列表失败',
      variant: "destructive",
    });
    throw error;
  }
}

// 更新商品状态
export async function updateProductStatus(productId: string, status: number): Promise<Product> {
  try {
    const response = await fetch(`/api/v1/admin/products/${productId}/status`, {
      method: 'PUT',
      headers: getBaseHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '更新商品状态失败');
    }

    const apiProduct = await response.json();
    const product = convertApiProduct(apiProduct);
    
    toast({
      title: "成功",
      description: "商品状态已更新",
    });
    return product;
  } catch (error) {
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '更新商品状态失败',
      variant: "destructive",
    });
    throw error;
  }
}

// 更新商品信息
export async function updateProduct(productId: string, productName: string): Promise<Product> {
  try {
    productSchema.parse({ product_name: productName });

    const response = await fetch(`/api/v1/admin/products/${productId}`, {
      method: 'PUT',
      headers: getBaseHeaders(),
      body: JSON.stringify({ productName: productName.trim() }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '更新商品信息失败');
    }

    const apiProduct = await response.json();
    const product = convertApiProduct(apiProduct);
    
    toast({
      title: "成功",
      description: "商品信息已更新",
    });
    return product;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '更新商品信息失败',
      variant: "destructive",
    });
    throw error;
  }
} 