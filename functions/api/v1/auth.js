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
      const userStores = await db.prepare(`
        SELECT 
          u.user_id,
          u.user_name,
          GROUP_CONCAT(ur.store_id) as store_ids,
          GROUP_CONCAT(ur.role_id) as role_ids,
          GROUP_CONCAT(s.store_name) as store_names
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN stores s ON ur.store_id = s.store_id
        WHERE u.user_id = ?
        GROUP BY u.user_id, u.user_name
      `).bind(user_id).first();

      if (!userStores) {
        return new Response(JSON.stringify({ message: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const response = {
        user_id: userStores.user_id,
        user_name: userStores.user_name,
        stores: userStores.store_ids.split(',').map((store_id, index) => ({
          store_id,
          role_id: userStores.role_ids.split(',')[index],
          store_name: userStores.store_names.split(',')[index]
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