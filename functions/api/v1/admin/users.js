import { adminAuthMiddleware } from '../../../middleware/adminAuth';

export async function onRequest(context) {
  const { request, env } = context;
  
  // 使用中间件验证
  const authResult = await adminAuthMiddleware(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const { corsHeaders } = authResult;
  const db = env.salesTrackingDB;

  try {
    if (request.method === 'GET') {
      // 获取所有员工（包含其角色和门店信息）
      const users = await db.prepare(`
        SELECT 
          u.user_id, 
          u.user_name, 
          u.created_at,
          u.role_id,
          GROUP_CONCAT(s.store_id) as store_ids,
          GROUP_CONCAT(s.store_name) as store_names
        FROM users u
        LEFT JOIN user_stores us ON u.user_id = us.user_id
        LEFT JOIN stores s ON us.store_id = s.store_id
        GROUP BY u.user_id, u.user_name, u.created_at, u.role_id
        ORDER BY u.created_at DESC
      `).all();

      // 处理结果，将门店信息转换为数组，添加更多的空值检查
      const formattedUsers = users.results.map(user => {
        // 确保 store_ids 和 store_names 存在且不为空
        const store_ids = user.store_ids ? user.store_ids.split(',').filter(Boolean) : [];
        const store_names = user.store_names ? user.store_names.split(',').filter(Boolean) : [];
        
        return {
          ...user,
          // 确保返回的是有效的数组
          stores: store_ids.length > 0 
            ? store_ids.map((store_id, index) => ({
                store_id: store_id || '',
                store_name: store_names[index] || ''
              }))
            : [] // 如果没有门店，返回空数组
        };
      });

      // 在返回之前检查数据格式
      const safeFormattedUsers = formattedUsers.map(user => ({
        user_id: user.user_id || '',
        user_name: user.user_name || '',
        created_at: user.created_at || '',
        role_id: user.role_id || null,
        stores: Array.isArray(user.stores) ? user.stores : []
      }));

      return new Response(JSON.stringify(safeFormattedUsers), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (request.method === 'POST') {
      const { user_id, user_name } = await request.json();

      // 验证输入
      if (!user_id || !user_name?.trim()) {
        return new Response(JSON.stringify({ message: '员工ID和姓名不能为空' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 验证姓名格式（只允许中文字符）
      if (!/^[\u4e00-\u9fa5]{2,20}$/.test(user_name)) {
        return new Response(JSON.stringify({ message: '员工姓名只能包含2-20个中文字符' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查用户名是否已存在
      const existingUser = await db.prepare(
        'SELECT user_id FROM users WHERE user_name = ?'
      ).bind(user_name.trim()).first();

      if (existingUser) {
        return new Response(JSON.stringify({ message: '该员工姓名已存在' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 添加新员工
      await db.prepare(
        'INSERT INTO users (user_id, user_name, created_at) VALUES (?, ?, datetime("now"))'
      ).bind(user_id, user_name.trim()).run();

      // 获取新添加的员工信息
      const newUser = await db.prepare(
        'SELECT user_id, user_name, created_at FROM users WHERE user_id = ?'
      ).bind(user_id).first();

      return new Response(JSON.stringify(newUser), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: '服务器内部错误：' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} 