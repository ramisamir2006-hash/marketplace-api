// ============================================================
// FILE 9: backend/routes/merchants.js
// إدارة التجار والمتاجر
// ============================================================

const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const { verifyToken, verifyMerchant, verifyAdmin } = require('../middleware/auth');

// POST /api/merchants/register — تسجيل كتاجر
router.post('/register', verifyToken, async (req, res) => {
  try {
    const {
      store_name, store_description,
      store_phone, store_email,
      governorate, country,
      national_id, bank_account
    } = req.body;

    if (!store_name)
      return res.status(400).json({ error: 'اسم المتجر مطلوب' });

    // تحقق أنه لم يسجل من قبل
    const { data: existing } = await supabase
      .from('merchants').select('id').eq('user_id', req.user.id).single();

    if (existing)
      return res.status(400).json({ error: 'لديك متجر مسجل بالفعل' });

    const { data, error } = await supabase
      .from('merchants')
      .insert([{
        user_id: req.user.id,
        store_name, store_description,
        store_phone, store_email,
        governorate, country: country || 'EG',
        national_id, bank_account
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // تحديث دور المستخدم
    await supabase.from('users')
      .update({ role: 'merchant' })
      .eq('id', req.user.id);

    res.status(201).json({ merchant: data, message: 'تم إنشاء المتجر بنجاح، في انتظار الموافقة' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/merchants/dashboard/stats — إحصائيات لوحة تحكم التاجر
router.get('/dashboard/stats', verifyMerchant, async (req, res) => {
  try {
    const mid = req.merchant.id;
    const today = new Date().toISOString().split('T')[0];

    const [
      productsRes, allOrdersRes, pendingRes,
      paidOrdersRes, todayOrdersRes, todayRevenueRes
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact' }).eq('merchant_id', mid).eq('is_active', true),
      supabase.from('orders').select('id', { count: 'exact' }).eq('merchant_id', mid),
      supabase.from('orders').select('id', { count: 'exact' }).eq('merchant_id', mid).eq('status', 'pending'),
      supabase.from('orders').select('total_amount').eq('merchant_id', mid).eq('payment_status', 'paid'),
      supabase.from('orders').select('id', { count: 'exact' }).eq('merchant_id', mid).gte('created_at', today),
      supabase.from('orders').select('total_amount').eq('merchant_id', mid).eq('payment_status', 'paid').gte('created_at', today)
    ]);

    const total_revenue = paidOrdersRes.data?.reduce((s, o) => s + o.total_amount, 0) || 0;
    const today_revenue = todayRevenueRes.data?.reduce((s, o) => s + o.total_amount, 0) || 0;

    res.json({
      total_products:  productsRes.count,
      total_orders:    allOrdersRes.count,
      pending_orders:  pendingRes.count,
      today_orders:    todayOrdersRes.count,
      total_revenue,
      today_revenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/merchants/my-store — بيانات متجر التاجر الحالي
router.get('/my-store', verifyMerchant, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', req.merchant.id)
      .single();

    if (error) return res.status(404).json({ error: 'المتجر غير موجود' });
    res.json({ merchant: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/merchants/update — تحديث بيانات المتجر
router.put('/update', verifyMerchant, async (req, res) => {
  try {
    const {
      store_name, store_description,
      store_logo, store_banner,
      store_phone, store_email, governorate
    } = req.body;

    const { data, error } = await supabase
      .from('merchants')
      .update({ store_name, store_description, store_logo, store_banner, store_phone, store_email, governorate })
      .eq('id', req.merchant.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ merchant: data, message: 'تم تحديث بيانات المتجر' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/merchants — قائمة جميع التجار (عام)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, governorate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('merchants')
      .select('id, store_name, store_description, store_logo, governorate, rating, total_sales, is_verified', { count: 'exact' })
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search)     query = query.ilike('store_name', `%${search}%`);
    if (governorate) query = query.eq('governorate', governorate);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json({ merchants: data, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/merchants/:id — صفحة متجر تاجر
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('merchants')
      .select(`
        id, store_name, store_description, store_logo, store_banner,
        store_phone, store_email, governorate, rating, total_sales,
        is_verified, created_at,
        products (id, title_ar, price, original_price, images, rating, views, stock)
      `)
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error) return res.status(404).json({ error: 'المتجر غير موجود' });
    res.json({ merchant: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/merchants/:id/notifications — إشعارات التاجر
router.get('/my/notifications', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ notifications: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/merchants/notifications/read-all — تعليم كل الإشعارات كمقروءة
router.put('/notifications/read-all', verifyToken, async (req, res) => {
  await supabase.from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.user.id);
  res.json({ message: 'تم تعليم كل الإشعارات كمقروءة' });
});

module.exports = router;
