const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function adminAuthMiddleware(request, env) {
  // 处理 OPTIONS 请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ message: '未授权访问' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const db = env.salesTrackingDB;
    const admin = await db.prepare(
      'SELECT * FROM admins WHERE token = ? AND token_expires > datetime("now", "+8 hours")'
    ).bind(token).first();

    if (!admin) {
      return new Response(JSON.stringify({ message: '无效或过期的令牌' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return { admin, corsHeaders }; // 返回验证通过的管理员信息和corsHeaders
  } catch (error) {
    return new Response(JSON.stringify({ message: '验证过程中发生错误' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} 