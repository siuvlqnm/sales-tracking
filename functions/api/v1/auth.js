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
      
      const db = env.DB.salesTrackingDB;
      const user = await db.prepare(`
        SELECT 
          u.user_id,
          u.user_name,
          ur.store_id,
          ur.role_id,
          s.store_name
        FROM users u
        JOIN user_role ur ON u.user_id = ur.user_id
        JOIN stores s ON ur.store_id = s.store_id
        WHERE u.user_id = ?
      `).bind(user_id).first();

      if (!user) {
        return new Response(JSON.stringify({ message: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(user), {
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