// ============================================================
// FILE 7: backend/routes/products.js
// مسارات المنتجات الكاملة
// ============================================================

const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const { verifyToken, verifyMerchant } = require('../middleware/auth');

// GET /api/products — قائمة المنتجات مع فلترة كاملة
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      category, merchant_id,
      min_price, max_price,
      search, governorate,
      country, featured,
      sort = 'newest', tags
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('products')
      .select(`
        id, title_ar, title_en, price, original_price,
        images, rating, total_reviews, views, stock, is_featured,
        shipping_governorates, shipping_countries, created_at,
        merchants (id, store_name, store_logo, rating, governorate),
        categories (id, name_ar, name_en)
      `, { count: 'exact' })
      .eq('is_active', true)
      .gt('stock', 0)
      .range(offset, offset + parseInt(limit) - 1);

    if (category)    query = query.eq('category_id', category);
    if (merchant_id) query = query.eq('merchant_id', merchant_id);
    if (min_price)   query = query.gte('price', parseFloat(min_price));
    if (max_price)   query = query.lte('price', parseFloat(max_price));
    if (featured === 'true') query = query.eq('is_featured', true);
    if (search)      query = query.or(`title_ar.ilike.%${search}%,title_en.ilike.%${search}%,description_ar.ilike.%${search}%`);
    if (governorate) query = query.contains('shipping_governorates', [governorate]);
    if (country)     query = query.contains('shipping_countries', [country]);
    if (tags)        query = query.contains('tags', [tags]);

    switch (sort) {
      case 'price_asc':  query = query.order('price', { ascending: true });  break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'rating':     query = query.order('rating', { ascending: false }); break;
      case 'popular':    query = query.order('views', { ascending: false });  break;
      default:           query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json({
      products: data,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id — تفاصيل منتج واحد
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        merchants (id, store_name, store_logo, store_description, store_phone, rating, total_sales, governorate),
        categories (id, name_ar, name_en),
        reviews (id, rating, comment, images, created_at, users (full_name, avatar_url))
      `)
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'المنتج غير موجود' });

    // زيادة عدد المشاهدات
    await supabase
      .from('products')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', req.params.id);

    res.json({ product: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — إضافة منتج جديد (التجار فقط)
router.post('/', verifyMerchant, async (req, res) => {
  try {
    const {
      title_ar, title_en,
      description_ar, description_en,
      price, original_price,
      category_id, images, video_url,
      stock, shipping_governorates,
      shipping_countries, shipping_cost,
      tags, is_featured
    } = req.body;

    if (!title_ar || !price || !images?.length)
      return res.status(400).json({ error: 'الاسم العربي والسعر وصورة واحدة على الأقل مطلوبة' });

    const { data, error } = await supabase
      .from('products')
      .insert([{
        merchant_id: req.merchant.id,
        title_ar, title_en,
        description_ar, description_en,
        price: parseFloat(price),
        original_price: original_price ? parseFloat(original_price) : null,
        category_id,
        images: images || [],
        video_url: video_url || null,
        stock: parseInt(stock) || 0,
        shipping_governorates: shipping_governorates || [],
        shipping_countries:    shipping_countries    || [],
        shipping_cost:         parseFloat(shipping_cost) || 0,
        tags:                  tags || [],
        is_featured:           is_featured || false
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ product: data, message: 'تم إضافة المنتج بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — تعديل منتج
router.put('/:id', verifyMerchant, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('merchant_id', req.merchant.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: 'المنتج غير موجود أو ليس لديك صلاحية' });

    res.json({ product: data, message: 'تم تحديث المنتج بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — حذف منتج (إخفاء)
router.delete('/:id', verifyMerchant, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('merchant_id', req.merchant.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'تم حذف المنتج بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/:id/review — إضافة تقييم
router.post('/:id/review', verifyToken, async (req, res) => {
  try {
    const { rating, comment, images } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'التقييم يجب أن يكون بين 1 و5' });

    // تحقق أن المستخدم اشترى المنتج
    const { data: order } = await supabase
      .from('order_items')
      .select('id, orders!inner(buyer_id, status)')
      .eq('product_id', req.params.id)
      .eq('orders.buyer_id', req.user.id)
      .eq('orders.status', 'delivered')
      .limit(1)
      .single();

    if (!order)
      return res.status(403).json({ error: 'يمكنك التقييم فقط بعد استلام المنتج' });

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        product_id: req.params.id,
        buyer_id: req.user.id,
        rating: parseInt(rating),
        comment,
        images: images || []
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // إعادة حساب متوسط التقييم
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', req.params.id);

    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await supabase.from('products')
      .update({ rating: avg.toFixed(2), total_reviews: allReviews.length })
      .eq('id', req.params.id);

    res.status(201).json({ review: data, message: 'تم إضافة تقييمك بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/:id/wishlist — إضافة/إزالة من المفضلة
router.post('/:id/wishlist', verifyToken, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.id)
      .single();

    if (existing) {
      await supabase.from('wishlist').delete().eq('id', existing.id);
      return res.json({ wishlisted: false, message: 'تم إزالة المنتج من المفضلة' });
    } else {
      await supabase.from('wishlist').insert([{ user_id: req.user.id, product_id: req.params.id }]);
      return res.json({ wishlisted: true, message: 'تم إضافة المنتج إلى المفضلة' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
