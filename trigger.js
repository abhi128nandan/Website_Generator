const http = require('http');

function generate(prompt) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve({ raw: body }); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ text: prompt }));
    req.end();
  });
}

async function run() {
  const prompts = [
    "Todo App with Task entities",
    "Inventory System with Products, Categories, and Suppliers",
    "CRM with Contacts, Deals, and Companies",
    "Student Management System with Students, Courses, and Enrollments"
  ];

  for (const prompt of prompts) {
    console.log(`\n--- Generating: ${prompt} ---`);
    const result = await generate(prompt);
    console.log(`Project ID: ${result.projectId || 'FAILED'}`);
    if (!result.projectId) console.log(JSON.stringify(result, null, 2));
    // wait 3s between triggers to avoid overlap
    await new Promise(r => setTimeout(r, 3000));
  }
}

run();
