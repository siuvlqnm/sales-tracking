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

      const response = {
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        role_id: userInfo.role_id,
        stores: userInfo.store_ids.split(',').map((store_id, index) => ({
          store_id,
          store_name: userInfo.store_names.split(',')[index]
        }))
      };

      return new Response(JSON.stringify(response), {
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