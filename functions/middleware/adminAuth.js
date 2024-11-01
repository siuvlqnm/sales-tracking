export async function adminAuthMiddleware(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ message: '未授权访问' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    // 验证管理员 token
    const db = env.salesTrackingDB;
    const admin = await db.prepare(
      'SELECT * FROM admins WHERE token = ? AND token_expires > CURRENT_TIMESTAMP'
    ).bind(token).first();

    if (!admin) {
      return new Response(JSON.stringify({ message: '无效或过期的令牌' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return null; // 验证通过
  } catch (error) {
    return new Response(JSON.stringify({ message: '验证过程中发生错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 