export async function onRequest(context) {
    const { env } = context;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  
    if (context.request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
  
    if (context.request.method === 'GET') {
      try {
        const cachedProducts = await env.SALES_TRACKING_CACHE.get('all_products', { type: 'json' });
        
        if (cachedProducts) {
          return new Response(JSON.stringify(cachedProducts), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const db = env.SALES_TRACKING_DB;
        
        const result = await db.prepare(`
          SELECT 
            product_id as productID,
            product_name as productName
          FROM products 
          WHERE product_status = 1
        `).all();

        await env.SALES_TRACKING_CACHE.put('all_products', JSON.stringify(result.results));

        return new Response(JSON.stringify(result.results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), {
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