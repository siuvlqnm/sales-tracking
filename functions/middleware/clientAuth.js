// 验证 JWT token 并返回用户信息
export async function validateToken(request, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.split(' ')[1];
  const [, payload] = token.split('.');
  if (!payload) {
    throw new Response(JSON.stringify({ message: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 解码并验证 token
  const decodedPayload = JSON.parse(atob(payload));
  if (decodedPayload.exp * 1000 < Date.now()) {
    throw new Response(JSON.stringify({ message: 'Token expired' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return decodedPayload.user;
} 