export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const user_id = url.searchParams.get('user_id');
      const store_id = url.searchParams.get('store_id');
      const start_date = url.searchParams.get('start_date');
      const end_date = url.searchParams.get('end_date');

      let query = `
        SELECT 
          sr.id,
          sr.user_id,
          u.user_name,
          sr.store_id,
          s.store_name,
          sr.actual_amount,
          sr.submission_time
        FROM sales_records sr
        JOIN users u ON sr.user_id = u.user_id
        JOIN stores s ON sr.store_id = s.store_id
        WHERE 1=1
      `;
      
      const params = [];
      if (user_id) {
        query += ' AND sr.user_id = ?';
        params.push(user_id);
      }
      if (store_id) {
        query += ' AND sr.store_id = ?';
        params.push(store_id);
      }
      if (start_date) {
        query += ' AND sr.submission_time >= ?';
        params.push(start_date);
      }
      if (end_date) {
        query += ' AND sr.submission_time <= ?';
        params.push(end_date);
      }
      
      query += ' ORDER BY sr.submission_time DESC';

      const db = env.DB.salesTrackingDB;
      const records = await db.prepare(query).bind(...params).all();

      return new Response(JSON.stringify(records.results), {
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