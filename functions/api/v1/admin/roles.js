export async function onRequest(context) {
    const { request, env } = context;
  
    // 使用中间件验证
    const authResult = await adminAuthMiddleware(request, env);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { corsHeaders } = authResult;
    
    const db = context.env.salesTrackingDB;

  try {
    if (request.method === 'POST') {
      const { user_id, role_id } = await request.json();

      // 验证输入
      if (!user_id || !role_id) {
        return new Response(JSON.stringify({ message: '用户ID和角色ID不能为空' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 验证角色ID是否有效
      if (![1, 2].includes(role_id)) {
        return new Response(JSON.stringify({ message: '无效的角色ID' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查用户是否存在
      const user = await db.prepare(
        'SELECT user_id, role_id FROM users WHERE user_id = ?'
      ).bind(user_id).first();

      if (!user) {
        return new Response(JSON.stringify({ message: '用户不存在' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 更新用户角色
      await db.prepare(`
        UPDATE users 
        SET role_id = ? 
        WHERE user_id = ?
      `).bind(role_id, user_id).run();

      // 获取更新后的用户信息（包含门店信息）
      const updatedUser = await db.prepare(`
        SELECT 
          u.user_id, 
          u.user_name, 
          u.role_id,
          GROUP_CONCAT(s.store_id) as store_ids,
          GROUP_CONCAT(s.store_name) as store_names
        FROM users u
        LEFT JOIN user_stores us ON u.user_id = us.user_id
        LEFT JOIN stores s ON us.store_id = s.store_id
        WHERE u.user_id = ?
        GROUP BY u.user_id, u.user_name, u.role_id
      `).bind(user_id).first();

      // 格式化用户信息
      const formattedUser = {
        ...updatedUser,
        stores: updatedUser.store_ids ? updatedUser.store_ids.split(',').map((store_id, index) => ({
          store_id,
          store_name: updatedUser.store_names.split(',')[index]
        })) : []
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