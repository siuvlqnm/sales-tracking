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
      const { user_id } = await request.json();
      
      const db = env.SALES_TRACKING_DB;
      const userInfo = await db.prepare(`
        SELECT 
          user_id,
          user_name,
          role_id
        FROM users 
        WHERE user_id = ?
      `).bind(user_id).first();

      if (!userInfo) {
        return new Response(JSON.stringify({ message: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const user = {
        id: userInfo.user_id,
        name: userInfo.user_name,
        role: userInfo.role_id === 1 ? 'manager' : 'salesperson'
      }; 

      function base64UrlEncode(input) {
        let binary;
        if (input instanceof Uint8Array) {
          binary = input;
        } else {
          // 将字符串转换为 UTF-8 编码的 Uint8Array
          binary = new TextEncoder().encode(input);
        }
        
        // 将二进制数据转换为 base64
        const base64 = btoa(String.fromCharCode(...binary));
        
        // 转换为 base64url 格式
        return base64
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      }
  
      const now = Math.floor(Date.now() / 1000);
      // const expiresHours = context.env.CLIENT_TOKEN_EXPIRES_HOURS || 24; // 默认24小时
      const payload = {
        user,
        iat: now,
        exp: now + (context.env.CLIENT_TOKEN_EXPIRES_HOURS * 60 * 60)
      };
  
      const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payloadB64 = base64UrlEncode(JSON.stringify(payload));
      const message = `${header}.${payloadB64}`;
  
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(context.env.JWT_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
  
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(message)
      );
  
      const token = `${message}.${base64UrlEncode(new Uint8Array(signature))}`;

      return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: corsHeaders
  });
} 