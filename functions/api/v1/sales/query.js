import { validateToken } from '../../../middleware/clientAuth';

export async function onRequest(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method === 'GET') {
    try {
      const user = await validateToken(context, corsHeaders);
      const url = new URL(request.url);
      const storeID = url.searchParams.get('storeID');
      const startTs = url.searchParams.get('startTs');
      const endTs = url.searchParams.get('endTs');

      let query = `
        SELECT 
          sr.id,
          sr.user_id,
          u.user_name,
          sr.store_id,
          s.store_name,
          sr.actual_amount,
          sr.submit_ts,
          sr.customer_name,
          sr.phone,
          p.product_name,
          sr.notes,
          sr.order_no
        FROM sales_records sr
        JOIN users u ON sr.user_id = u.user_id
        JOIN stores s ON sr.store_id = s.store_id
        JOIN products p ON sr.product_id = p.product_id
        WHERE sr.store_id IN (
          SELECT store_id FROM user_store_rel WHERE user_id = ?
        )
        AND sr.deleted_at IS NULL
      `;

      const params = [user.id];

      if (user.role !== 'manager') {
        query += ' AND sr.user_id = ?';
        params.push(user.id);
      }

      if (storeID) {
        query += ' AND sr.store_id = ?';
        params.push(storeID);
      }

      if (startTs) {
        query += ' AND sr.submit_ts >= ?';
        params.push(parseInt(startTs));
      }

      if (endTs) {
        query += ' AND sr.submit_ts <= ?';
        params.push(parseInt(endTs));
      }

      query += ' ORDER BY sr.submit_ts DESC';

      const db = env.SALES_TRACKING_DB;
      const records = await db.prepare(query).bind(...params).all();

      return new Response(JSON.stringify(records.results), {
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

  if (request.method === 'DELETE') {
    try {
      const user = await validateToken(context, corsHeaders);
      const { recordID, reason } = await request.json();

      if (!recordID || !reason) {
        return new Response(JSON.stringify({ message: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const db = env.SALES_TRACKING_DB;

      // 验证记录是否存在且属于该用户的门店
      const record = await db.prepare(`
        SELECT sr.* FROM sales_records sr
        JOIN user_store_rel usr ON sr.store_id = usr.store_id
        WHERE sr.id = ? AND usr.user_id = ? AND sr.deleted_at IS NULL
      `).bind(recordID, user.id).first();

      if (!record) {
        return new Response(JSON.stringify({ message: 'Record not found or unauthorized' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 执行软删除
      await db.prepare(`
        UPDATE sales_records 
        SET deleted_at = datetime('now', '+8 hours'),
            deleted_by = ?,
            delete_reason = ?
        WHERE id = ?
      `).bind(user.id, reason, recordID).run();

      return new Response(JSON.stringify({ message: 'Record deleted successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
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