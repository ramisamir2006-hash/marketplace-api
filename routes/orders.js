const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { verifyToken, verifyMerchant } = require('../middleware/auth');

const genOrderNumber = () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;

router.post('/', verifyToken, async (req, res) => {
  try {
    const { items, shipping_address, governorate, country = 'EG', payment_method, notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'السلة فارغة' });
    if (!shipping_address || !governorate) return res.status(400).json({ error: 'العنوان والمحافظة مطلوبان' });

    const productIds = items.map(i => i.product_id);
    const { data: products } = await supabase.from('products').select('id, price, stock, shipping_cost, merchant_id, title_ar').in('id', productIds);

    let subtotal = 0;
    let max_shipping = 0;
    const merchant_id = products[0].merchant_id;

    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      if (!product) throw new Error(`المنتج غير موجود`);
      if (product.stock < item.quantity) throw new Error(`"${product.title_ar}" غير متوفر بالكمية المطلوبة`);
      const total_price = product.price * item.quantity;
      subtotal += total_price;
      max_shipping = Math.max(max_shipping, product.shipping_cost || 0);
      return { product_id: item.product_id, quantity: item.quantity, unit_price: product.price, total_price };
    });

    const total_amount = subtotal + max_shipping;

    const { data: order, error: orderErr } = await supabase.from('orders')
      .insert([{ order_number: genOrderNumber(), buyer_id: req.user.id, merchant_id, total_amount, shipping_cost: max_shipping, payment_method: payment_method || 'cash', payment_status: 'unpaid', shipping_address, governorate, country, notes, status: 'pending' }])
      .select().single();
    if (orderErr) return res.status(400).json({ error: orderErr.message });

    await supabase.from('order_items').insert(orderItems.map(i => ({ ...i, order_id: order.id })));

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      await supabase.from('products').update({ stock: product.stock - item.quantity }).eq('id', item.product_id);
    }

    await supabase.from('notifications').insert([{ user_id: merchant_id, title: '🛍️ طلب جديد!', body: `لديك طلب جديد رقم ${order.order_number} بقيمة ${total_amount} ج.م`, type: 'order', data: { order_id: order.id } }]);

    res.status(201).json({ order, message: 'تم إنشاء الطلب بنجاح', summary: { subtotal, shipping: max_shipping, total: total_amount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase.from('orders')
      .select('id, order_number, status, total_amount, shipping_cost, payment_method, payment_status, governorate, created_at, tracking_number, merchants(store_name, store_logo), order_items(quantity, unit_price, total_price, products(title_ar, images))', { count: 'exact' })
      .eq('buyer_id', req.user.id).order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

    if (status) query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ orders: data, total: count, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/merchant', verifyMerchant, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase.from('orders')
      .select('id, order_number, status, total_amount, shipping_cost, payment_method, payment_status, governorate, country, shipping_address, notes, tracking_number, created_at, updated_at, users(full_name, phone, email), order_items(quantity, unit_price, total_price, products(title_ar, images, id))', { count: 'exact' })
      .eq('merchant_id', req.merchant.id).order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

    if (status) query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ orders: data, total: count, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders')
      .select('*, users(full_name, phone, email), merchants(store_name, store_phone, store_email, store_logo), order_items(*, products(title_ar, title_en, images, price, id))')
      .eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json({ order: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', verifyMerchant, async (req, res) => {
  try {
    const { status, tracking_number } = req.body;
    const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });

    const updates = { status, updated_at: new Date().toISOString() };
    if (tracking_number) updates.tracking_number = tracking_number;
    if (status === 'delivered') updates.payment_status = 'paid';

    const { data, error } = await supabase.from('orders').update(updates).eq('id', req.params.id).eq('merchant_id', req.merchant.id).select().single();
    if (error) return res.status(400).json({ error: error.message });

    const statusLabels = { confirmed: 'تم تأكيد طلبك', shipped: 'تم شحن طلبك', delivered: 'تم تسليم طلبك', cancelled: 'تم إلغاء طلبك' };
    await supabase.from('notifications').insert([{ user_id: data.buyer_id, title: `تحديث طلبك ${data.order_number}`, body: statusLabels[status], type: 'order', data: { order_id: data.id, status } }]);

    res.json({ order: data, message: 'تم تحديث حالة الطلب' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { data: order } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (!order || order.buyer_id !== req.user.id) return res.status(403).json({ error: 'ليس لديك صلاحية' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'لا يمكن إلغاء طلب بعد تأكيده' });

    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', req.params.id);
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', req.params.id);
    for (const item of items) {
      const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
      await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id);
    }
    res.json({ message: 'تم إلغاء الطلب' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
