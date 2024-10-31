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
      const { user_id, store_id, actual_amount } = await request.json();
      
      const db = env.DB.salesTrackingDB;
      // 验证用户权限
      const userRole = await db.prepare(`
        SELECT role_id FROM user_role 
        WHERE user_id = ? AND store_id = ?
      `).bind(user_id, store_id).first();

      if (!userRole) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 插入销售记录
      const now = new Date().toISOString();
      await db.prepare(`
        INSERT INTO sales_records (
          user_id, store_id, actual_amount, 
          submission_time, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(user_id, store_id, actual_amount, now, now).run();

      return new Response(JSON.stringify({ message: 'Sales record created successfully' }), {
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