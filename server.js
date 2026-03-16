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

// Health check
app.get('/', (req, res) => {
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

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Server Error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Souq Egypt API running on port ${PORT}`);
});

module.exports = app;
