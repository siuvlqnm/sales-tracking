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
      const start_date = url.searchParams.get('start_date');
      const end_date = url.searchParams.get('end_date');

      if (!start_date || !end_date) {
        throw new Error('Missing required date parameters');
      }

      const db = context.env.salesTrackingDB;

      // 1. 获取每日销售数据
      const dailySalesQuery = `
        SELECT 
          DATE(submission_time) as date,
          SUM(actual_amount) as total
        FROM sales_records
        WHERE DATE(submission_time) BETWEEN DATE(?) AND DATE(?)
        GROUP BY DATE(submission_time)
        ORDER BY date ASC
      `;
      const dailySales = await db.prepare(dailySalesQuery)
        .bind(start_date, end_date)
        .all();

      // 2. 获取销售人员业绩排名
      const topSalespeopleQuery = `
        SELECT 
          u.user_name as name,
          SUM(sr.actual_amount) as total
        FROM sales_records sr
        JOIN users u ON sr.user_id = u.user_id
        WHERE DATE(sr.submission_time) BETWEEN DATE(?) AND DATE(?)
        GROUP BY u.user_name
        ORDER BY total DESC
        LIMIT 5
      `;
      const topSalespeople = await db.prepare(topSalespeopleQuery)
        .bind(start_date, end_date)
        .all();

      // 3. 修改为获取商品销售数据（按金额分组统计笔数）
      const productPerformanceQuery = `
        SELECT 
          actual_amount as amount,
          COUNT(*) as count
        FROM sales_records
        WHERE DATE(submission_time) BETWEEN DATE(?) AND DATE(?)
        GROUP BY actual_amount
        ORDER BY count DESC
      `;
      const productPerformance = await db.prepare(productPerformanceQuery)
        .bind(start_date, end_date)
        .all();

      const response = {
        dailySales: dailySales.results.map(row => ({
          date: row.date,
          total: Number(row.total)
        })),
        topSalespeople: topSalespeople.results.map(row => ({
          name: row.name,
          total: Number(row.total)
        })),
        productPerformance: productPerformance.results.map(row => ({
          amount: Number(row.amount),
          count: Number(row.count)
        }))
      };

      return new Response(JSON.stringify(response), {
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