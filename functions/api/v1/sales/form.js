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
      const { user_id, store_id, amounts, timestamp } = await request.json();

      if (!Array.isArray(amounts) || amounts.length === 0) {
        return new Response(JSON.stringify({ message: 'Invalid input' }), { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      const db = context.env.salesTrackingDB;

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

      // 构建批量插入的 SQL
      const sql = `
        INSERT INTO sales_records (
          user_id, store_id, actual_amount, 
          submission_time, created_at
        ) VALUES ${amounts.map(() => '(?, ?, ?, datetime(?), datetime(?))').join(', ')}
      `;

      // 展平所有记录的值到一个数组
      const values = amounts.flatMap(amount => [
        user_id,
        store_id,
        amount,
        timestamp,
        timestamp // created_at 使用相同的时间戳
      ]);

      await db.prepare(sql).bind(...values).run();

      return new Response(JSON.stringify({ 
        message: 'Sales records submitted successfully',
        count: amounts.length
      }), { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        message: error.message || 'Internal Server Error' 
      }), { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  return new Response('Method Not Allowed', { 
    status: 405,
    headers: corsHeaders
  });
} 