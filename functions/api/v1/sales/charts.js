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

      if (!startTs || !endTs) {
        throw new Error('Missing required timestamp parameters');
      }

      const db = env.SALES_TRACKING_DB;
      const isManager = user.role === 'manager';
      
      // 基础查询条件
      const baseConditions = `
        WHERE sr.submit_ts BETWEEN ? AND ?
        AND sr.store_id IN (SELECT store_id FROM user_store_rel WHERE user_id = ?)
        AND sr.deleted_at IS NULL
        ${storeID ? 'AND sr.store_id = ?' : ''}
        ${!isManager ? 'AND sr.user_id = ?' : ''}
      `;

      // 1. 每日销售数据
      const dailySalesQuery = `
        SELECT 
          DATE(sr.submit_ts/1000, 'unixepoch') as date,
          SUM(sr.actual_amount) as total
        FROM sales_records sr
        ${baseConditions}
        GROUP BY DATE(sr.submit_ts/1000, 'unixepoch')
        ORDER BY date DESC
      `;

      const dailySalesParams = [
        startTs, 
        endTs,
        user.id,
        ...(storeID ? [storeID] : []),
        ...(!isManager ? [user.id] : [])
      ];

      const dailySales = await db.prepare(dailySalesQuery)
        .bind(...dailySalesParams)
        .all();

      // 2. 销售人员排名（仅管理员可见）
      let topSalespeople = [];
      if (isManager) {
        const topSalespeopleQuery = `
          SELECT 
            u.user_name as name,
            SUM(sr.actual_amount) as total
          FROM sales_records sr
          JOIN users u ON sr.user_id = u.user_id
          ${baseConditions}
          GROUP BY u.user_name
          ORDER BY total DESC
          LIMIT 5
        `;

        const topSalesResult = await db.prepare(topSalespeopleQuery)
          .bind(...dailySalesParams)
          .all();

        topSalespeople = topSalesResult.results;
      }

      // 3. 商品销售数据
      const productQuery = `
        SELECT 
          p.product_name as name,
          COUNT(*) as count,
          SUM(sr.actual_amount) as total
        FROM sales_records sr
        JOIN products p ON sr.product_id = p.product_id
        ${baseConditions}
        GROUP BY sr.product_id, p.product_name
        ORDER BY count DESC
      `;

      const productPerformance = await db.prepare(productQuery)
        .bind(...dailySalesParams)
        .all();

      // 构造响应数据
      const response = {
        dailySales: dailySales.results.map(row => ({
          date: row.date,
          total: Number(row.total)
        })),
        ...(isManager && { topSalespeople: topSalespeople.map(row => ({
          name: row.name,
          total: Number(row.total)
        }))}),
        productPerformance: productPerformance.results.map(row => ({
          name: row.name,
          count: Number(row.count),
          total: Number(row.total)
        }))
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Chart API Error:', error);
      return new Response(JSON.stringify({ 
        message: error.message || 'Internal Server Error' 
      }), {
        status: error instanceof Response ? error.status : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method Not Allowed', {
    status: 405,
    headers: corsHeaders
  });
} 