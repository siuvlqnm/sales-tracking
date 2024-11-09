import { adminAuthMiddleware } from '../../../../middleware/adminAuth';

export async function onRequest(context) {
  const { request, env } = context;
  
  const authResult = await adminAuthMiddleware(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const { corsHeaders } = authResult;
  const db = env.SALES_TRACKING_DB;

  try {
    if (request.method === 'POST') {
      const { user_id, store_ids } = await request.json();

      // 验证输入
      if (!user_id || !Array.isArray(store_ids)) {
        return new Response(JSON.stringify({ message: '无效的输入参数' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 使用 D1 事务 API
      const updatedUser = await db.batch([
        // 首先删除现有的门店分配
        db.prepare('DELETE FROM user_stores WHERE user_id = ?').bind(user_id),
        
        // 然后添加新的门店分配
        ...store_ids.map(store_id => 
          db.prepare(`
            INSERT INTO user_stores (user_id, store_id, created_at) 
            VALUES (?, ?, datetime('now', '+8 hours'))
          `).bind(user_id, store_id)
        ),
        
        // 最后获取更新后的用户信息
        db.prepare(`
          SELECT 
            u.user_id, 
            u.user_name, 
            u.role_id,
            u.created_at,
            GROUP_CONCAT(s.store_id) as store_ids,
            GROUP_CONCAT(s.store_name) as store_names
          FROM users u
          LEFT JOIN user_stores us ON u.user_id = us.user_id
          LEFT JOIN stores s ON us.store_id = s.store_id
          WHERE u.user_id = ?
          GROUP BY u.user_id
        `).bind(user_id)
      ]);

      // 清除用户的门店缓存
      const cacheKey = `stores:${user_id}`;
      await env.SALES_TRACKING_CACHE.delete(cacheKey);

      // 获取最后一个查询的结果（更新后的用户信息）
      const userData = updatedUser[updatedUser.length - 1];

      // 处理返回的数据格式
      const formattedUser = {
        ...userData,
        stores: userData.store_ids 
          ? userData.store_ids.split(',').map((store_id, index) => ({
              store_id,
              store_name: userData.store_names.split(',')[index]
            }))
          : []
      };

      return new Response(JSON.stringify(formattedUser), {
        status: 200,
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