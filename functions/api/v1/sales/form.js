import { validateToken } from '../../../middleware/clientAuth';

export async function onRequest(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method === 'POST') {
    try {
      const user = await validateToken(context, corsHeaders);
      const { store_id, amounts, timestamp } = await request.json();

      if (!Array.isArray(amounts) || amounts.length === 0) {
        return new Response(JSON.stringify({ message: 'Invalid input' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const db = env.SALES_TRACKING_DB;

      // 验证用户权限
      const userStore = await db.prepare(`
        SELECT 1 FROM user_stores 
        WHERE user_id = ? AND store_id = ?
      `).bind(user.id, store_id).first();

      if (!userStore) {
        return new Response(JSON.stringify({ message: 'Unauthorized store access' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 构建批量插入的 SQL，使用传入的时间戳
      const sql = `
        INSERT INTO sales_records (
          user_id, store_id, actual_amount, 
          submission_time, created_at
        ) VALUES ${amounts.map(() => '(?, ?, ?, ?, datetime("now", "+8 hours"))').join(', ')}
      `;

      // 展平所有记录的值到一个数组，使用传入的时间戳
      const values = amounts.flatMap(amount => [
        user.id,
        store_id,
        amount,
        timestamp // 使用前端传入的东八区时间戳
      ]);

      await db.prepare(sql).bind(...values).run();

      return new Response(JSON.stringify({ 
        message: 'Sales records submitted successfully',
        count: amounts.length
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      return new Response(JSON.stringify({ 
        message: error.message || 'Internal Server Error' 
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