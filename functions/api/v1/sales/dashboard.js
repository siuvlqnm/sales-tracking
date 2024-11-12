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
      
      const db = env.SALES_TRACKING_DB;
      
      // 获取东八区当前时间
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
      // 获取东八区当月第一天和最后一天的时间戳
      const firstDay = new Date(now.toLocaleString('en-US', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: 'numeric',
        day: '1',
        hour: '0',
        minute: '0',
        second: '0',
        hour12: false
      })).getTime();

      const lastDay = new Date(now.toLocaleString('en-US', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: 'numeric',
        day: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
        hour: '23',
        minute: '59',
        second: '59',
        hour12: false
      })).getTime();

      // 1. 获取个人/团队月度业绩
      const performanceQuery = `
        SELECT 
          COUNT(*) as order_count,
          SUM(actual_amount) as total_amount
        FROM sales_records
        WHERE submit_ts BETWEEN ? AND ?
        AND store_id IN (
          SELECT store_id FROM user_store_rel WHERE user_id = ?
        )
        ${store_id ? 'AND store_id = ?' : ''}
        ${user.role !== 'manager' ? 'AND user_id = ?' : ''}
      `;
      
      const performanceParams = [
        firstDay, 
        lastDay,
        user.id,
        ...(store_id ? [store_id] : []),
        ...(user.role !== 'manager' ? [user.id] : [])
      ];
      
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
          sr.submit_ts
        FROM sales_records sr
        JOIN users u ON sr.user_id = u.user_id
        JOIN stores s ON sr.store_id = s.store_id
        WHERE sr.store_id IN (
          SELECT store_id FROM user_store_rel WHERE user_id = ?
        )
        ${store_id ? 'AND sr.store_id = ?' : ''}
        ${user.role !== 'manager' ? 'AND sr.user_id = ?' : ''}
        ORDER BY sr.submit_ts DESC
        LIMIT 5
      `;
      
      const recentSalesParams = [
        user.id,
        ...(store_id ? [store_id] : []),
        ...(user.role !== 'manager' ? [user.id] : [])
      ];

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
          WHERE submit_ts BETWEEN ? AND ?
          AND sr.store_id IN (
            SELECT store_id FROM user_store_rel WHERE user_id = ?
          )
          ${store_id ? 'AND sr.store_id = ?' : ''}
          GROUP BY u.user_name
          ORDER BY total_sales DESC
          LIMIT 5
        `;
        
        const topSalesParams = [
          firstDay,
          lastDay,
          user.id,
          ...(store_id ? [store_id] : [])
        ];

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
          date: record.submit_ts
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