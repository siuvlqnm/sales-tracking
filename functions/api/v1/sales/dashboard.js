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
      const user = await validateToken(request, corsHeaders);
      const url = new URL(request.url);
      const store_id = url.searchParams.get('store_id');
      
      const db = context.env.salesTrackingDB;
      
      // 获取当月第一天和最后一天
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // 1. 获取个人/团队月度业绩
      const performanceQuery = `
        SELECT 
          COUNT(*) as order_count,
          SUM(actual_amount) as total_amount
        FROM sales_records
        WHERE DATE(submission_time) BETWEEN DATE(?) AND DATE(?)
        ${user.role === 'manager' ? (store_id ? 'AND store_id = ?' : '') : 'AND user_id = ?'}
      `;
      
      const performanceParams = [firstDay, lastDay];
      if (user.role === 'manager') {
        if (store_id) performanceParams.push(store_id);
      } else {
        performanceParams.push(user.id);
      }
      
      const performance = await db.prepare(performanceQuery)
        .bind(...performanceParams)
        .first();

      // 2. 获取最近销售记录
      const recentSalesQuery = `
        SELECT 
          sr.id,
          u.user_name,
          s.store_name,
          sr.actual_amount,
          sr.submission_time
        FROM sales_records sr
        JOIN users u ON sr.user_id = u.user_id
        JOIN stores s ON sr.store_id = s.store_id
        WHERE ${user.role === 'manager' ? (store_id ? 'sr.store_id = ?' : '1=1') : 'sr.user_id = ?'}
        ORDER BY sr.submission_time DESC
        LIMIT 5
      `;
      
      const recentSalesParams = user.role === 'manager' 
        ? (store_id ? [store_id] : [])
        : [user.id];

      const recentSales = await db.prepare(recentSalesQuery)
        .bind(...recentSalesParams)
        .all();

      // 3. 获取销售排行榜（仅管理员可见）
      let topSalespeople = { results: [] };
      if (user.role === 'manager') {
        const topSalesQuery = `
          SELECT 
            u.user_name as name,
            SUM(sr.actual_amount) as total_sales
          FROM sales_records sr
          JOIN users u ON sr.user_id = u.user_id
          WHERE ${store_id ? 'sr.store_id = ? AND' : ''}
            DATE(sr.submission_time) BETWEEN DATE(?) AND DATE(?)
          GROUP BY u.user_name
          ORDER BY total_sales DESC
          LIMIT 5
        `;
        
        const topSalesParams = store_id 
          ? [store_id, firstDay, lastDay]
          : [firstDay, lastDay];

        topSalespeople = await db.prepare(topSalesQuery)
          .bind(...topSalesParams)
          .all();
      }

      const response = {
        performance: {
          monthlySales: Number(performance.total_amount) || 0,
          monthlyOrders: Number(performance.order_count) || 0
        },
        recentSales: recentSales.results.map(record => ({
          id: record.id,
          user_name: record.user_name,
          store_name: record.store_name,
          amount: Number(record.actual_amount),
          date: record.submission_time
        })),
        topSalespeople: topSalespeople.results?.map(person => ({
          name: person.name,
          sales: Number(person.total_sales)
        })) || []
      };

      return new Response(JSON.stringify(response), {
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