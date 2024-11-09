import { validateToken } from '../../../middleware/clientAuth';

export async function onRequest(context) {
  const { env, request } = context;
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
        
        // 尝试从 KV 获取缓存的门店数据
        const cacheKey = `stores:${user.id}`;
        let stores = await env.SALES_TRACKING_CACHE.get(cacheKey, { type: 'json' });

        // 如果没有缓存或缓存过期，从数据库获取
        if (!stores) {
            const query = `
                SELECT us.store_id, s.store_name
                FROM user_stores us
                JOIN stores s ON us.store_id = s.store_id
                WHERE us.user_id = ?
            `;

            const result = await env.SALES_TRACKING_DB
                .prepare(query)
                .bind(user.id)
                .all();

            stores = result.results;

            // 缓存数据，设置 5 分钟过期
            await env.SALES_TRACKING_CACHE.put(cacheKey, JSON.stringify(stores));
        }

        return new Response(JSON.stringify(stores), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        } catch (error) {
            return new Response(JSON.stringify({ message: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    }
    
    return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders
      });
} 