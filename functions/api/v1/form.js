export function onRequest(context) {
  const request = context.request;
  const env = context.env;

  console.log('Request method:', request.method);
  console.log('Request path:', new URL(request.url).pathname);
  console.log('Request headers:', Object.fromEntries(request.headers));

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  if (request.method === 'POST') {
    return handlePostRequest(request, env, corsHeaders);
  }

  return new Response('Method Not Allowed', { 
    status: 405,
    headers: corsHeaders
  });
}

async function handlePostRequest(request, env, corsHeaders) {
  try {
    const { salesperson_id, amounts, timestamp } = await request.json();

    if (!salesperson_id || !amounts || !Array.isArray(amounts) || amounts.length === 0) {
      return new Response(JSON.stringify({ message: 'Invalid input' }), { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const db = env.DB;

    const sql = `
      INSERT INTO sales_records (salesperson_id, amount, timestamp)
      VALUES ${amounts.map(() => '(?, ?, ?)').join(', ')}
    `;

    const values = amounts.flatMap(amount => [salesperson_id, amount, timestamp]);

    await db.prepare(sql).bind(...values).run();

    return new Response(JSON.stringify({ message: 'Sales records submitted successfully' }), { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { 
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}