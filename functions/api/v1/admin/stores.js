import { adminAuthMiddleware } from '../../../middleware/adminAuth';

export async function onRequest(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 验证管理员权限
  const authError = await adminAuthMiddleware(request, env);
  if (authError) return authError;

  const db = context.env.salesTrackingDB;

  if (request.method === 'GET') {
    try {
      const stores = await db.prepare(
        'SELECT * FROM stores ORDER BY created_at DESC'
      ).all();

      return new Response(JSON.stringify(stores.results), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        message: '获取门店列表失败' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  if (request.method === 'POST') {
    try {
      const { store_id, store_name } = await request.json();

      // 数据验证
      if (!store_id || !store_name) {
        return new Response(JSON.stringify({ 
          message: '门店ID和名称不能为空' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查门店名称是否已存在
      const existing = await db.prepare(
        'SELECT store_id FROM stores WHERE store_name = ?'
      ).bind(store_name).first();

      if (existing) {
        return new Response(JSON.stringify({ 
          message: '门店名称已存在' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 插入新门店
      const result = await db.prepare(`
        INSERT INTO stores (store_id, store_name, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        RETURNING *
      `).bind(store_id, store_name).first();

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        message: error.message || '添加门店失败' 
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