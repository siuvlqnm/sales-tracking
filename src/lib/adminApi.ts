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
  role_id: number;
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

const baseHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
};

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
    .regex(/^[\u4e00-\u9fa5]{2,20}$/, '员工姓名只能包含中文字符')
});

const roleSchema = z.object({
  user_id: z.string().min(1, '请选择员工'),
  role_id: z.number().int().min(1).max(2, '无效的角色ID')
});

const storeAssignmentSchema = z.object({
  user_id: z.string().min(1, '请选择员工'),
  store_id: z.string().min(1, '请选择门店')
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

    if (!token || !expires) return false;

    // 检查是否过期
    if (Date.now() > Number(expires)) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminTokenExpires');
      return false;
    }

    const response = await fetch('/api/v1/admin/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch {
    return false;
  }
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
      headers: baseHeaders,
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
      headers: baseHeaders,
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
      headers: baseHeaders,
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

// 分配角色
export async function assignRole(
  userId: string,
  roleId: number
): Promise<User> {
  try {
    roleSchema.parse({ user_id: userId, role_id: roleId });

    const response = await fetch('/api/v1/admin/roles', {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        user_id: userId,
        role_id: roleId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '分配角色失败');
    }

    const data = await response.json();
    toast({
      title: "成功",
      description: "角色分配成功",
    });
    return data;
  } catch (error) {
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '分配角色失败',
      variant: "destructive",
    });
    throw error;
  }
}

// 添加新的门店分配函数
export async function assignStore(
  userId: string,
  storeId: string
): Promise<StoreAssignment> {
  try {
    storeAssignmentSchema.parse({ user_id: userId, store_id: storeId });

    const response = await fetch('/api/v1/admin/stores/assign', {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        user_id: userId,
        store_id: storeId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '分配门店失败');
    }

    const data = await response.json();
    toast({
      title: "成功",
      description: "门店分配成功",
    });
    return data;
  } catch (error) {
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : '分配门店失败',
      variant: "destructive",
    });
    throw error;
  }
} 