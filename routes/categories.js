const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('name_ar');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ categories: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: category } = await supabase.from('categories').select('*').eq('id', req.params.id).single();
    const { data: products } = await supabase.from('products').select('id, title_ar, price, original_price, images, rating, merchants(store_name)').eq('category_id', req.params.id).eq('is_active', true).order('created_at', { ascending: false });
    res.json({ category, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
