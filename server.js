const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/merchants',  require('./routes/merchants'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/ads',        require('./routes/ads'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/upload',     require('./routes/upload'));
app.use('/api/categories', require('./routes/categories'));

// Health check - JSON endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: '✅ Souq Egypt API Running',
    version: '1.0.0',
    time: new Date().toISOString(),
    endpoints: [
      '/api/auth',
      '/api/products',
      '/api/orders',
      '/api/merchants',
      '/api/reports',
      '/api/ads',
      '/api/upload',
      '/api/categories'
    ]
  });
});

// Root endpoint - HTML status page with Vercel Analytics
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Souq Egypt API</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-top: 0; }
    .status { color: #16a34a; font-size: 1.2em; }
    .endpoints { list-style: none; padding: 0; }
    .endpoints li {
      padding: 8px;
      margin: 5px 0;
      background: #f8f9fa;
      border-radius: 4px;
      font-family: monospace;
    }
    .info { color: #666; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Souq Egypt API</h1>
    <p class="status">✅ API is running</p>
    <p>Version: 1.0.0</p>
    <p>Time: ${new Date().toISOString()}</p>
    
    <h2>Available Endpoints</h2>
    <ul class="endpoints">
      <li>/api/health - Health check endpoint</li>
      <li>/api/auth - Authentication</li>
      <li>/api/products - Products</li>
      <li>/api/orders - Orders</li>
      <li>/api/merchants - Merchants</li>
      <li>/api/reports - Reports</li>
      <li>/api/ads - Advertisements</li>
      <li>/api/upload - File uploads</li>
      <li>/api/categories - Categories</li>
    </ul>
    
    <p class="info">For API health check data, visit <a href="/api/health">/api/health</a></p>
  </div>
  
  <script>
    // Vercel Analytics - Web Analytics integration
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  </script>
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
  `);
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Server Error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Souq Egypt API running on port ${PORT}`);
});

module.exports = app;
