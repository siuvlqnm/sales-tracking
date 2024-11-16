import { adminAuthMiddleware } from '../../../middleware/adminAuth';

export async function onRequest(context) {
  const { request, env } = context;
  
  // 验证管理员身份
  const authResult = await adminAuthMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  const { corsHeaders } = authResult;

  if (request.method === 'GET') {
    try {
      const db = env.SALES_TRACKING_DB;
      const products = await db.prepare(`
        SELECT 
          product_id,
          product_name,
          product_status,
          created_at
        FROM products
        ORDER BY created_at DESC
      `).all();

      return new Response(JSON.stringify(products.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  if (request.method === 'POST') {
    try {
      const { productID, productName } = await request.json();

      if (!productID || !productName) {
        return new Response(JSON.stringify({ message: '缺少必要参数' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const db = env.SALES_TRACKING_DB;
      
      // 插入新商品
      await db.prepare(`
        INSERT INTO products (
          product_id, product_name, product_status, created_at
        ) VALUES (?, ?, 1, datetime('now', '+8 hours'))
      `).bind(productID, productName).run();

      // 清除商品缓存
      const cacheKey = `all_products`;
      await env.SALES_TRACKING_CACHE.delete(cacheKey);

      // 获取新插入的商品信息
      const newProduct = await db.prepare(
        'SELECT * FROM products WHERE product_id = ?'
      ).bind(productID).first();

      return new Response(JSON.stringify(newProduct), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  if (request.method === 'PUT') {
    try {
        const url = new URL(request.url);
        const productId = url.pathname.split('/').pop();
        const { productName } = await request.json();
  
        const db = env.SALES_TRACKING_DB;
  
        // 更新商品信息
        await db.prepare(`
          UPDATE products 
          SET product_name = ? 
          WHERE product_id = ?
        `).bind(productName, productId).run();
  
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