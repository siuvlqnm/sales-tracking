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
      
      const db = context.env.salesTrackingDB;
      const userInfo = await db.prepare(`
        SELECT 
          u.user_id,
          u.user_name,
          u.role_id,
          GROUP_CONCAT(s.store_id) as store_ids,
          GROUP_CONCAT(s.store_name) as store_names
        FROM users u
        JOIN user_stores us ON u.user_id = us.user_id
        JOIN stores s ON us.store_id = s.store_id
        WHERE u.user_id = ?
        GROUP BY u.user_id, u.user_name, u.role_id
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
        role: userInfo.role_id === 1 ? 'manager' : 'salesperson',
        storeIds: userInfo.store_ids.split(','),
        storeNames: Object.fromEntries(
          userInfo.store_ids.split(',').map((id, index) => [
            id,
            userInfo.store_names.split(',')[index]
          ])
        )
      };

      // JWT 签名
      const encoder = new TextEncoder();
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        user,
        exp: Math.floor(Date.now() / 1000) + (env.CLIENT_TOKEN_EXPIRES_HOURS * 60 * 60)
      }));
      
      const message = `${header}.${payload}`;
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(env.JWT_SECRET),
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