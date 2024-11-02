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
    if (request.method === 'GET') {
      // 获取所有员工（包含其角色和门店信息）
      const users = await db.prepare(`
        SELECT 
          u.user_id, 
          u.user_name, 
          u.created_at,
          ur.store_id,
          ur.role_id
        FROM users u
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id
        ORDER BY u.created_at DESC
      `).all();

      return new Response(JSON.stringify(users.results), {
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