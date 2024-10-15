async function handleSalesRecordsRequest(request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const salesperson = url.searchParams.get('salesperson');
  const store = url.searchParams.get('store');

  // 验证用户身份和权限
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  // 这里需要实现 token 验证逻辑，确定用户身份和角色

  let query = `
    SELECT sr.id, u.name as salesperson_name, s.name as store_name, sr.amount, sr.timestamp
    FROM sales_records sr
    JOIN users u ON sr.salesperson_id = u.id
    JOIN stores s ON sr.store_id = s.id
    WHERE 1=1
  `;
  const queryParams = [];

  if (date) {
    query += ` AND DATE(sr.timestamp) = ?`;
    queryParams.push(date);
  }
  if (salesperson) {
    query += ` AND u.name LIKE ?`;
    queryParams.push(`%${salesperson}%`);
  }
  if (store) {
    query += ` AND s.name LIKE ?`;
    queryParams.push(`%${store}%`);
  }

  // 如果是销售人员，只显示自己的记录
  if (userRole === 'salesperson') {
    query += ` AND u.id = ?`;
    queryParams.push(userId);
  }

  query += ` ORDER BY sr.timestamp DESC`;

  try {
    const results = await db.query(query, queryParams);
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

async function handleSalesChartsRequest(request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  // 验证用户身份和权限
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  // 这里需要实现 token 验证逻辑，确定用户身份和角色

  // 确保用户是店长
  if (userRole !== 'manager') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  try {
    // 获取每日销售额数据
    const dailySalesQuery = `
      SELECT DATE(timestamp) as date, SUM(amount) as total_sales
      FROM sales_records
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY DATE(timestamp)
      ORDER BY date
    `;
    const dailySalesResults = await db.query(dailySalesQuery, [startDate, endDate]);

    // 获取销售人员业绩排名数据
    const topSalespeopleQuery = `
      SELECT u.name as salesperson, SUM(sr.amount) as total_sales
      FROM sales_records sr
      JOIN users u ON sr.salesperson_id = u.id
      WHERE sr.timestamp BETWEEN ? AND ?
      GROUP BY sr.salesperson_id
      ORDER BY total_sales DESC
      LIMIT 10
    `;
    const topSalespeopleResults = await db.query(topSalespeopleQuery, [startDate, endDate]);

    // 获取门店销售占比数据
    const storePerformanceQuery = `
      SELECT s.name as store, SUM(sr.amount) as total_sales
      FROM sales_records sr
      JOIN stores s ON sr.store_id = s.id
      WHERE sr.timestamp BETWEEN ? AND ?
      GROUP BY sr.store_id
    `;
    const storePerformanceResults = await db.query(storePerformanceQuery, [startDate, endDate]);

    // 处理数据以适应图表格式
    const dailySales = {
      labels: dailySalesResults.map(r => r.date),
      datasets: [{
        label: '每日销售额',
        data: dailySalesResults.map(r => r.total_sales),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };

    const topSalespeople = {
      labels: topSalespeopleResults.map(r => r.salesperson),
      datasets: [{
        label: '销售业绩',
        data: topSalespeopleResults.map(r => r.total_sales),
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      }]
    };

    const storePerformance = {
      labels: storePerformanceResults.map(r => r.store),
      datasets: [{
        label: '门店销售额',
        data: storePerformanceResults.map(r => r.total_sales),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ]
      }]
    };

    return new Response(JSON.stringify({
      dailySales,
      topSalespeople,
      storePerformance
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// 在路由处理中添加新的端点
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/salesRecords' && request.method === 'GET') {
    return handleSalesRecordsRequest(request);
  }
  if (path === '/api/salesCharts' && request.method === 'GET') {
    return handleSalesChartsRequest(request);
  }

  // ... 其他现有的路由处理 ...
}
