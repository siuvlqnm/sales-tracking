export async function onRequest(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // 处理 OPTIONS 请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 验证管理员 token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ message: '未授权访问' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.split(' ')[1];
  const db = context.env.salesTrackingDB;

  // 验证 token
  const admin = await db.prepare(
    'SELECT * FROM admins WHERE token = ? AND token_expires > datetime("now")'
  ).bind(token).first();

  if (!admin) {
    return new Response(JSON.stringify({ message: '无效或过期的 token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    if (request.method === 'POST') {
      const { user_id, store_id, role_id } = await request.json();

      // 验证输入
      if (!user_id || !store_id || !role_id) {
        return new Response(JSON.stringify({ message: '用户ID、门店ID和角色ID都不能为空' }), {
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
        'SELECT user_id FROM users WHERE user_id = ?'
      ).bind(user_id).first();

      if (!user) {
        return new Response(JSON.stringify({ message: '用户不存在' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查门店是否存在
      const store = await db.prepare(
        'SELECT store_id FROM stores WHERE store_id = ?'
      ).bind(store_id).first();

      if (!store) {
        return new Response(JSON.stringify({ message: '门店不存在' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查是否已经存在角色分配
      const existingRole = await db.prepare(
        'SELECT id FROM user_roles WHERE user_id = ?'
      ).bind(user_id).first();

      if (existingRole) {
        // 更新现有角色
        await db.prepare(`
          UPDATE user_roles 
          SET store_id = ?, role_id = ? 
          WHERE user_id = ?
        `).bind(store_id, role_id, user_id).run();
      } else {
        // 添加新角色
        await db.prepare(`
          INSERT INTO user_roles (user_id, store_id, role_id, created_at) 
          VALUES (?, ?, ?, datetime("now"))
        `).bind(user_id, store_id, role_id).run();
      }

      // 获取更新后的角色信息
      const updatedRole = await db.prepare(`
        SELECT id, user_id, store_id, role_id, created_at 
        FROM user_roles 
        WHERE user_id = ?
      `).bind(user_id).first();

      return new Response(JSON.stringify(updatedRole), {
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