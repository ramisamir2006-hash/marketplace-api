// ============================================================
// FILE 11-A: backend/routes/ads.js — الإعلانات
// ============================================================

const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const { verifyAdmin } = require('../middleware/auth');

// GET /api/ads — جلب الإعلانات النشطة
router.get('/', async (req, res) => {
  try {
    const { position, country, limit = 10 } = req.query;
    const now = new Date().toISOString();

    let query = supabase
      .from('advertisements')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .limit(parseInt(limit));

    if (position) query = query.eq('position', position);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    // زيادة عداد المشاهدات
    if (data?.length) {
      const ids = data.map(a => a.id);
      await supabase.from('advertisements')
        .update({ views: supabase.raw('views + 1') })
        .in('id', ids);
    }

    res.json({ ads: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ads/click/:id — تسجيل نقرة على إعلان
router.post('/click/:id', async (req, res) => {
  try {
    const { data } = await supabase
      .from('advertisements').select('clicks').eq('id', req.params.id).single();

    await supabase.from('advertisements')
      .update({ clicks: (data?.clicks || 0) + 1 })
      .eq('id', req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ads — إنشاء إعلان جديد (مدير فقط)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('advertisements')
      .insert([req.body])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ ad: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/ads/:id — تحديث إعلان
router.put('/:id', verifyAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('advertisements').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ad: data });
});

// DELETE /api/ads/:id — حذف إعلان
router.delete('/:id', verifyAdmin, async (req, res) => {
  await supabase.from('advertisements').update({ is_active: false }).eq('id', req.params.id);
  res.json({ message: 'تم حذف الإعلان' });
});

module.exports = router;

// ============================================================
// FILE 11-B: backend/routes/upload.js — رفع الملفات
// ============================================================
// انشئ ملف منفصل اسمه routes/upload.js وانسخ هذا الكود:

/*
const express    = require('express');
const router     = express.Router();
const cloudinary = require('cloudinary').v2;
const { verifyToken } = require('../middleware/auth');

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET
});

// POST /api/upload/image — رفع صورة
router.post('/image', verifyToken, async (req, res) => {
  try {
    const { base64, folder = 'products' } = req.body;
    if (!base64) return res.status(400).json({ error: 'الصورة مطلوبة' });

    const result = await cloudinary.uploader.upload(base64, {
      folder: `marketplace/${folder}`,
      resource_type: 'image',
      quality: 'auto:good',
      fetch_format: 'auto'
    });

    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    res.status(500).json({ error: 'فشل رفع الصورة: ' + err.message });
  }
});

// POST /api/upload/video — رفع فيديو
router.post('/video', verifyToken, async (req, res) => {
  try {
    const { base64 } = req.body;
    const result = await cloudinary.uploader.upload(base64, {
      resource_type: 'video',
      folder: 'marketplace/videos',
      quality: 'auto:good'
    });
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    res.status(500).json({ error: 'فشل رفع الفيديو: ' + err.message });
  }
});

// DELETE /api/upload/:public_id — حذف ملف
router.delete('/:public_id', verifyToken, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.public_id);
    res.json({ message: 'تم حذف الملف' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
*/

// ============================================================
// FILE 11-C: backend/routes/categories.js — التصنيفات
// ============================================================
// انشئ ملف منفصل اسمه routes/categories.js وانسخ هذا الكود:

/*
const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');

// GET /api/categories
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ categories: data });
});

// GET /api/categories/:id/products
router.get('/:id/products', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, title_ar, price, images, rating, merchant_id, merchants(store_name)')
    .eq('category_id', req.params.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ products: data });
});

module.exports = router;
*/
