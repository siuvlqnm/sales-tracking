import { adminAuthMiddleware } from '../../../middleware/adminAuth';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  const authResult = await adminAuthMiddleware(request, env);
  
  // 如果 authResult 是 Response 对象，说明验证失败
  if (authResult instanceof Response) {
    return authResult;
  }
  
  // 验证成功，返回 200 状态码
  return new Response(JSON.stringify({ 
    status: 'success',
    message: '令牌有效'
  }), {
    status: 200,
    headers: {
      ...authResult.corsHeaders,
      'Content-Type': 'application/json'
    }
  });
} 