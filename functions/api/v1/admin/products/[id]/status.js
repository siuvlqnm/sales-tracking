import { adminAuthMiddleware } from '../../../../../middleware/adminAuth';

export async function onRequest(context) {
  const { request, env } = context;
  
  const authResult = await adminAuthMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  const { corsHeaders } = authResult;

  if (request.method === 'PUT') {
    try {
      const url = new URL(request.url);
      const productId = url.pathname.split('/').slice(-2)[0];
      const { status } = await request.json();

      const db = env.SALES_TRACKING_DB;
      
      // 更新商品状态
      await db.prepare(`
        UPDATE products 
        SET product_status = ? 
        WHERE product_id = ?
      `).bind(status, productId).run();

      // 清除商品缓存
      await env.SALES_TRACKING_CACHE.delete('all_products');

      // 获取更新后的商品信息
      const updatedProduct = await db.prepare(
        'SELECT * FROM products WHERE product_id = ?'
      ).bind(productId).first();

      return new Response(JSON.stringify(updatedProduct), {
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