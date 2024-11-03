import { adminAuthMiddleware } from '../../../../middleware/adminAuth';

export async function onRequest(context) {
  const { request, env } = context;
  
  const authResult = await adminAuthMiddleware(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const { corsHeaders } = authResult;
  const db = env.salesTrackingDB;

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

      // 开始事务
      await db.prepare('BEGIN TRANSACTION').run();

      try {
        // 删除用户现有的所有门店分配
        await db.prepare(
          'DELETE FROM user_stores WHERE user_id = ?'
        ).bind(user_id).run();

        // 添加新的门店分配
        for (const store_id of store_ids) {
          await db.prepare(`
            INSERT INTO user_stores (user_id, store_id, created_at) 
            VALUES (?, ?, datetime('now', '+8 hours'))
          `).bind(user_id, store_id).run();
        }

        // 提交事务
        await db.prepare('COMMIT').run();

        // 获取更新后的用户信息
        const updatedUser = await db.prepare(`
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
        `).bind(user_id).first();

        return new Response(JSON.stringify(updatedUser), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        // 如果出错，回滚事务
        await db.prepare('ROLLBACK').run();
        throw error;
      }
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