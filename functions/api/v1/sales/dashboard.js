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
      
      const db = env.SALES_TRACKING_DB;
      
      // 获取东八区当前时间
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
      
      // 获取东八区当月第一天
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      firstDay.setHours(0, 0, 0, 0);
      
      // 获取东八区当月最后一天
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      lastDay.setHours(23, 59, 59, 999);

      // Convert to timestamps
      const firstDayTs = firstDay.getTime();
      const lastDayTs = lastDay.getTime();

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
        AND deleted_at IS NULL
        ${storeID ? 'AND store_id = ?' : ''}
        ${user.role !== 'manager' ? 'AND user_id = ?' : ''}
      `;
      
      const performanceParams = [
        firstDayTs, 
        lastDayTs,
        user.id,
        ...(storeID ? [storeID] : []),
        ...(user.role !== 'manager' ? [user.id] : [])
      ];
      
      const performance = await db.prepare(performanceQuery)
        .bind(...performanceParams)
        .first();

      // 2. 获取最近销售记录
      const recentSalesQuery = `
        SELECT 
          sr.id,
          sr.order_no,
          u.user_name,
          s.store_name,
          sr.actual_amount,
          sr.submit_ts,
          sr.customer_name,
          p.product_name
        FROM sales_records sr
        JOIN users u ON sr.user_id = u.user_id
        JOIN stores s ON sr.store_id = s.store_id
        JOIN products p ON sr.product_id = p.product_id
        WHERE sr.store_id IN (
          SELECT store_id FROM user_store_rel WHERE user_id = ?
        )
        AND sr.deleted_at IS NULL
        ${storeID ? 'AND sr.store_id = ?' : ''}
        ${user.role !== 'manager' ? 'AND sr.user_id = ?' : ''}
        ORDER BY sr.submit_ts DESC
        LIMIT 5
      `;
      
      const recentSalesParams = [
        user.id,
        ...(storeID ? [storeID] : []),
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
          AND sr.deleted_at IS NULL
          ${storeID ? 'AND sr.store_id = ?' : ''}
          GROUP BY u.user_name
          ORDER BY total_sales DESC
          LIMIT 5
        `;
        
        const topSalesParams = [
          firstDayTs,
          lastDayTs,
          user.id,
          ...(storeID ? [storeID] : [])
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
          order_no: record.order_no,
          user_name: record.user_name,
          store_name: record.store_name,
          amount: Number(record.actual_amount),
          date: record.submit_ts,
          customer_name: record.customer_name,
          product_name: record.product_name
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