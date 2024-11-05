function base64UrlDecode(input) {
  // 还原 base64 格式
  const base64 = input
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // 添加填充
  const padLength = (4 - (base64.length % 4)) % 4;
  const paddedBase64 = base64 + '='.repeat(padLength);
  
  return atob(paddedBase64);
}

export async function validateToken(context, corsHeaders) {
  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.split(' ')[1];
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Response(JSON.stringify({ message: 'Invalid token format' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 解码头部和载荷
    const header = JSON.parse(base64UrlDecode(headerB64));
    const payload = JSON.parse(base64UrlDecode(payloadB64));

    // 检查算法
    if (header.alg !== 'HS256') {
      throw new Error('Unsupported algorithm');
    }

    // 检查过期时间
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      throw new Error('Token has expired');
    }

    // Verify signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(context.env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = this.base64UrlDecode(signatureB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    return payload.user;
  } catch (error) {
    throw new Response(JSON.stringify({ message: error.message }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} 