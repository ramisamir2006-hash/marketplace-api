const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { verifyToken, verifyMerchant } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, merchant_id, min_price, max_price, search, featured, sort = 'newest', governorate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('products')
      .select('id, title_ar, title_en, price, original_price, images, rating, total_reviews, views, stock, is_featured, shipping_governorates, shipping_countries, created_at, merchants(id, store_name, store_logo, rating), categories(id, name_ar, name_en)', { count: 'exact' })
      .eq('is_active', true)
      .range(offset, offset + parseInt(limit) - 1);

    if (category) query = query.eq('category_id', category);
    if (merchant_id) query = query.eq('merchant_id', merchant_id);
    if (min_price) query = query.gte('price', parseFloat(min_price));
    if (max_price) query = query.lte('price', parseFloat(max_price));
    if (featured === 'true') query = query.eq('is_featured', true);
    if (search) query = query.or(`title_ar.ilike.%${search}%,title_en.ilike.%${search}%`);
    if (governorate) query = query.contains('shipping_governorates', [governorate]);

    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else if (sort === 'rating') query = query.order('rating', { ascending: false });
    else if (sort === 'popular') query = query.order('views', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ products: data, total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, merchants(id, store_name, store_logo, store_description, store_phone, rating, total_sales), categories(id, name_ar, name_en), reviews(id, rating, comment, created_at, users(full_name, avatar_url))')
      .eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'المنتج غير موجود' });
    await supabase.from('products').update({ views: (data.views || 0) + 1 }).eq('id', req.params.id);
    res.json({ product: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyMerchant, async (req, res) => {
  try {
    const { title_ar, title_en, description_ar, price, original_price, category_id, images, video_url, stock, shipping_governorates, shipping_countries, shipping_cost, tags, is_featured } = req.body;
    if (!title_ar || !price || !images?.length)
      return res.status(400).json({ error: 'الاسم والسعر وصورة مطلوبة' });

    const { data, error } = await supabase.from('products')
      .insert([{ merchant_id: req.merchant.id, title_ar, title_en, description_ar, price: parseFloat(price), original_price: original_price ? parseFloat(original_price) : null, category_id, images: images || [], video_url: video_url || null, stock: parseInt(stock) || 0, shipping_governorates: shipping_governorates || [], shipping_countries: shipping_countries || [], shipping_cost: parseFloat(shipping_cost) || 0, tags: tags || [], is_featured: is_featured || false }])
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ product: data, message: 'تم إضافة المنتج' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyMerchant, async (req, res) => {
  try {
    const { data, error } = await supabase.from('products')
      .update(req.body).eq('id', req.params.id).eq('merchant_id', req.merchant.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ product: data, message: 'تم تحديث المنتج' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyMerchant, async (req, res) => {
  try {
    const { error } = await supabase.from('products')
      .update({ is_active: false }).eq('id', req.params.id).eq('merchant_id', req.merchant.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'تم حذف المنتج' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/review', verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { data, error } = await supabase.from('reviews')
      .insert([{ product_id: req.params.id, buyer_id: req.user.id, rating: parseInt(rating), comment }])
      .select().single();
    if (error) return res.status(400).json({ error: error.message });

    const { data: reviews } = await supabase.from('reviews').select('rating').eq('product_id', req.params.id);
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await supabase.from('products').update({ rating: avg.toFixed(2), total_reviews: reviews.length }).eq('id', req.params.id);
    res.status(201).json({ review: data, message: 'تم إضافة تقييمك' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/wishlist', verifyToken, async (req, res) => {
  try {
    const { data: existing } = await supabase.from('wishlist').select('id').eq('user_id', req.user.id).eq('product_id', req.params.id).single();
    if (existing) {
      await supabase.from('wishlist').delete().eq('id', existing.id);
      return res.json({ wishlisted: false, message: 'تم إزالة من المفضلة' });
    }
    await supabase.from('wishlist').insert([{ user_id: req.user.id, product_id: req.params.id }]);
    return res.json({ wishlisted: true, message: 'تم إضافة للمفضلة' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
