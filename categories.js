// ============================================================
// FILE 13: backend/routes/categories.js
// التصنيفات
// ============================================================

const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const { verifyAdmin } = require('../middleware/auth');

// GET /api/categories — جميع التصنيفات
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) return res.status(400).json({ error: error.message });
    res.json({ categories: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/categories/:id — تصنيف مع منتجاته
router.get('/:id', async (req, res) => {
  const { data: category } = await supabase
    .from('categories').select('*').eq('id', req.params.id).single();

  const { data: products } = await supabase
    .from('products')
    .select('id, title_ar, price, original_price, images, rating, merchants(store_name)')
    .eq('category_id', req.params.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  res.json({ category, products });
});

// POST /api/categories — إنشاء تصنيف (مدير فقط)
router.post('/', verifyAdmin, async (req, res) => {
  const { name_ar, name_en, icon, parent_id, sort_order } = req.body;
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name_ar, name_en, icon, parent_id, sort_order }])
    .select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ category: data });
});

module.exports = router;
