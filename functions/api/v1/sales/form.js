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

      // 修改数据库表结构的 SQL：
      /*
      ALTER TABLE sales_records ADD COLUMN customer_name TEXT;
      ALTER TABLE sales_records ADD COLUMN phone_number TEXT;
      ALTER TABLE sales_records ADD COLUMN card_type TEXT;
      ALTER TABLE sales_records ADD COLUMN notes TEXT;
      */

      // 修改插入语句：
      const sql = `
        INSERT INTO sales_records (
          user_id, store_id, actual_amount, 
          customer_name, phone_number, card_type, notes,
          submission_time, created_at
        ) VALUES ${amounts.map(() => 
          '(?, ?, ?, ?, ?, ?, ?, ?, datetime("now", "+8 hours"))'
        ).join(', ')}
      `;

      // 展平所有记录的值
      const values = records.flatMap(record => [
        user.id,
        store_id,
        record.amount,
        record.customerName,
        record.phoneNumber,
        record.cardType,
        record.notes,
        timestamp
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