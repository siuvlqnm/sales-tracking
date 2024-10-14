import { Env } from './types';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function handleOptions(request: Request) {
  if (request.headers.get("Origin") !== null &&
      request.headers.get("Access-Control-Request-Method") !== null &&
      request.headers.get("Access-Control-Request-Headers") !== null) {
    return new Response(null, {
      headers: corsHeaders
    });
  } else {
    return new Response(null, {
      headers: {
        Allow: "GET, POST, OPTIONS",
      },
    });
  }
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    
    if (url.pathname === "/api/salesInfo") {
      return handleSalesInfo(request, env);
    } else if (url.pathname === "/api/recordSales") {
      return handleRecordSales(request, env);
    } else {
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    }
  }
};

async function handleSalesInfo(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const tracking_id = url.searchParams.get('tracking_id');

  if (!tracking_id) {
    return new Response('Missing tracking_id', { status: 400, headers: corsHeaders });
  }

  try {
    const salesInfo = await env.DB.prepare(
      'SELECT s.id as salesperson_id, s.name as salesperson_name, st.id as store_id, st.name as store_name ' +
      'FROM salespersons s ' +
      'JOIN stores st ON s.store_id = st.id ' +
      'WHERE s.tracking_id = ?'
    ).bind(tracking_id).first();

    if (!salesInfo) {
      return new Response('Salesperson not found', { status: 404, headers: corsHeaders });
    }

    return new Response(JSON.stringify(salesInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error querying sales info:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}

async function handleRecordSales(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { salesperson_id, store_id, amounts, timestamp } = await request.json();

    if (!salesperson_id || !store_id || !Array.isArray(amounts) || amounts.length === 0 || !timestamp) {
      return new Response('Invalid input data', { status: 400, headers: corsHeaders });
    }

    const results = await env.DB.batch(amounts.map(amount => 
      env.DB.prepare(
        'INSERT INTO sales (salesperson_id, store_id, amount, timestamp) VALUES (?, ?, ?, ?)'
      ).bind(salesperson_id, store_id, amount, timestamp)
    ));

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully inserted ${results.length} sales records`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}

export default handler;
