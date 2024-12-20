export async function onRequest(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method === 'POST') {
    try {
      const { username, password } = await request.json();

      // 验证输入
      if (!username || !password) {
        return new Response(JSON.stringify({ 
          message: '用户名和密码不能为空' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const db = env.SALES_TRACKING_DB;

      // 密码哈希
      const encoder = new TextEncoder();
      const data = encoder.encode(password + context.env.ADMIN_SALT);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashedPassword = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // 查询管理员
      const admin = await db.prepare(
        'SELECT * FROM admins WHERE admin_name = ? AND pwd_hash = ?'
      ).bind(username, hashedPassword).first();

      if (!admin) {
        return new Response(JSON.stringify({ 
          message: '用户名或密码错误' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // JWT 签名
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        id: admin.id,
        username: admin.username,
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + (context.env.ADMIN_TOKEN_EXPIRES_HOURS * 60 * 60) // 使用环境变量
      }));
      
      const message = `${header}.${payload}`;
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(context.env.JWT_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(message)
      );
      
      const token = `${message}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '')}`;

      // 更新数据库中的 token
      await db.prepare(`
        UPDATE admins 
        SET token = ?, token_expires = datetime('now', '+8 hours', '+' || ? || ' hours')
        WHERE id = ?
      `).bind(token, context.env.ADMIN_TOKEN_EXPIRES_HOURS, admin.id).run();

      return new Response(JSON.stringify({
        token,
        expiresIn: context.env.ADMIN_TOKEN_EXPIRES_HOURS * 60 * 60 * 1000 // 转换为毫秒
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        message: error.message || '登录失败' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method Not Allowed', {
    status: 405,
    headers: corsHeaders
  });
} 