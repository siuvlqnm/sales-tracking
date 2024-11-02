import { createHash } from 'crypto';
import { sign } from 'jsonwebtoken';

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

      const db = env.salesTrackingDB;

      // 密码加盐哈希
      const hashedPassword = createHash('sha256')
        .update(password + env.ADMIN_SALT)
        .digest('hex');

      // 查询管理员
      const admin = await db.prepare(
        'SELECT * FROM admins WHERE username = ? AND password = ?'
      ).bind(username, hashedPassword).first();

      if (!admin) {
        return new Response(JSON.stringify({ 
          message: '用户名或密码错误' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 生成 JWT token
      const token = sign(
        { 
          id: admin.id,
          username: admin.username,
          role: 'admin'
        },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // 更新数据库中的 token
      await db.prepare(`
        UPDATE admins 
        SET token = ?, token_expires = datetime('now', '+24 hours')
        WHERE id = ?
      `).bind(token, admin.id).run();

      return new Response(JSON.stringify({
        token,
        expiresIn: 24 * 60 * 60 * 1000 // 24小时
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