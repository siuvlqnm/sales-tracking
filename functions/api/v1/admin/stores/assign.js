export async function onRequest(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 验证管理员权限
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ message: '未授权访问' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.split(' ')[1];
  const db = context.env.salesTrackingDB;

  try {
    if (request.method === 'POST') {
      const { user_id, store_id } = await request.json();

      // 验证输入
      if (!user_id || !store_id) {
        return new Response(JSON.stringify({ message: '用户ID和门店ID不能为空' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查用户和门店是否存在
      const [user, store] = await Promise.all([
        db.prepare('SELECT user_id FROM users WHERE user_id = ?').bind(user_id).first(),
        db.prepare('SELECT store_id FROM stores WHERE store_id = ?').bind(store_id).first()
      ]);

      if (!user || !store) {
        return new Response(JSON.stringify({ message: '用户或门店不存在' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查是否已经存在相同的分配
      const existing = await db.prepare(
        'SELECT id FROM user_stores WHERE user_id = ? AND store_id = ?'
      ).bind(user_id, store_id).first();

      if (existing) {
        return new Response(JSON.stringify({ message: '该用户已分配到此门店' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 添加新的门店分配
      await db.prepare(`
        INSERT INTO user_stores (user_id, store_id, created_at) 
        VALUES (?, ?, datetime('now'))
      `).bind(user_id, store_id).run();

      // 获取分配结果
      const assignment = await db.prepare(`
        SELECT id, user_id, store_id, created_at
        FROM user_stores
        WHERE user_id = ? AND store_id = ?
      `).bind(user_id, store_id).first();

      return new Response(JSON.stringify(assignment), {
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