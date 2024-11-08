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
      const store_id = url.searchParams.get('store_id');
      const start_date = url.searchParams.get('start_date');
      const end_date = url.searchParams.get('end_date');

      if (!start_date || !end_date) {
        throw new Error('Missing required date parameters');
      }

      const response = { dailySales: [], topSalespeople: [], productPerformance: [] };
      
      // 使用 user.role 替代 URL 参数中的 role
      const isManager = user.role === 'manager';
      
      // 1. 获取每日销售数据
      const dailySalesQuery = `
        SELECT 
          DATE(submission_time) as date,
          SUM(actual_amount) as total
        FROM sales_records
        WHERE DATE(submission_time) BETWEEN DATE(?) AND DATE(?)
        AND store_id IN (
          SELECT store_id FROM user_stores WHERE user_id = ?
        )
        ${store_id ? 'AND store_id = ?' : ''}
        ${!isManager ? 'AND user_id = ?' : ''}
        GROUP BY DATE(submission_time)
        ORDER BY date ASC
      `;
      const dailySalesParams = [
        start_date, 
        end_date,
        user.id,
        ...(store_id ? [store_id] : []),
        ...(!isManager ? [user.id] : [])
      ];

      const db = env.salesTrackingDB;
      
      const dailySales = await db.prepare(dailySalesQuery)
        .bind(...dailySalesParams)
        .all();
      
      response.dailySales = dailySales.results.map(row => ({
        date: row.date,
        total: Number(row.total)
      }));

      // 2. 只有管理员才能看到销售人员排名（仅本店）
      if (isManager) {
        const topSalespeopleQuery = `
          SELECT 
            u.user_name as name,
            SUM(sr.actual_amount) as total
          FROM sales_records sr
          JOIN users u ON sr.user_id = u.user_id
          WHERE DATE(sr.submission_time) BETWEEN DATE(?) AND DATE(?)
          AND sr.store_id IN (
            SELECT store_id FROM user_stores WHERE user_id = ?
          )
          ${store_id ? 'AND sr.store_id = ?' : ''}
          GROUP BY u.user_name
          ORDER BY total DESC
          LIMIT 5
        `;
        const topSalesParams = [
          start_date, 
          end_date, 
          user.id,
          ...(store_id ? [store_id] : [])
        ];

        const topSalespeople = await db.prepare(topSalespeopleQuery)
          .bind(...topSalesParams)
          .all();

        response.topSalespeople = topSalespeople.results.map(row => ({
          name: row.name,
          total: Number(row.total)
        }));
      }

      // 3. 获取商品销售数据
      const productPerformanceQuery = `
        SELECT 
          actual_amount as amount,
          COUNT(*) as count
        FROM sales_records
        WHERE DATE(submission_time) BETWEEN DATE(?) AND DATE(?)
        AND store_id IN (
          SELECT store_id FROM user_stores WHERE user_id = ?
        )
        ${store_id ? 'AND store_id = ?' : ''}
        ${!isManager ? 'AND user_id = ?' : ''}
        GROUP BY actual_amount
        ORDER BY count DESC
      `;
      const productParams = [
        start_date, 
        end_date,
        user.id,
        ...(store_id ? [store_id] : []),
        ...(!isManager ? [user.id] : [])
      ];

      const productPerformance = await db.prepare(productPerformanceQuery)
        .bind(...productParams)
        .all();

      response.productPerformance = productPerformance.results.map(row => ({
        amount: Number(row.amount),
        count: Number(row.count)
      }));

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