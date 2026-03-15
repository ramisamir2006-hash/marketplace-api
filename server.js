// ============================================================
// FILE 1: backend/server.js
// الملف الرئيسي للسيرفر - نقطة البداية
// ============================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes    = require('./routes/auth');
const merchantRoutes= require('./routes/merchants');
const productRoutes = require('./routes/products');
const orderRoutes   = require('./routes/orders');
const adRoutes      = require('./routes/ads');
const reportRoutes  = require('./routes/reports');
const uploadRoutes  = require('./routes/upload');
const categoryRoutes= require('./routes/categories');

const app = express();

// ---- Middleware ----
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---- Rate Limiting ----
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ---- Routes ----
app.use('/api/auth',       authRoutes);
app.use('/api/merchants',  merchantRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/ads',        adRoutes);
app.use('/api/reports',    reportRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/categories', categoryRoutes);

// ---- Health Check ----
app.get('/', (req, res) => {
  res.json({
    status: '✅ Marketplace API Running',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Server Error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API: http://localhost:${PORT}/api`);
});

module.exports = app;
