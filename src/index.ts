import { Env } from './types';

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const { tracking_id, amounts, timestamp } = await request.json();

      // 验证输入数据
      if (!tracking_id || !Array.isArray(amounts) || amounts.length === 0 || !timestamp) {
        return new Response('Invalid input data', { status: 400 });
      }

      // 查询销售人员和门店信息
      const salesInfo = await env.DB.prepare(
        'SELECT s.id as salesperson_id, s.name as salesperson_name, st.id as store_id, st.name as store_name ' +
        'FROM salespersons s ' +
        'JOIN stores st ON s.store_id = st.id ' +
        'WHERE s.tracking_id = ?'
      ).bind(tracking_id).first();

      if (!salesInfo) {
        return new Response('Salesperson not found', { status: 404 });
      }

      // 插入销售记录
      const results = await env.DB.batch(amounts.map(amount => 
        env.DB.prepare(
          'INSERT INTO sales (salesperson_id, store_id, amount, timestamp) VALUES (?, ?, ?, ?)'
        ).bind(salesInfo.salesperson_id, salesInfo.store_id, amount, timestamp)
      ));

      return new Response(JSON.stringify({
        success: true,
        message: `Successfully inserted ${results.length} sales records`,
        salesperson: salesInfo.salesperson_name,
        store: salesInfo.store_name
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing request:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

export default handler;
