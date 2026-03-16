const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { verifyMerchant, verifyAdmin } = require('../middleware/auth');

router.get('/daily', verifyMerchant, async (req, res) => {
  try {
    const reportDate = req.query.date || new Date().toISOString().split('T')[0];
    const start = `${reportDate}T00:00:00`;
    const end = `${reportDate}T23:59:59`;
    const mid = req.merchant.id;

    const { data: orders } = await supabase.from('orders')
      .select('id, order_number, status, total_amount, shipping_cost, payment_method, payment_status, governorate, created_at, users(full_name, phone), order_items(quantity, unit_price, total_price, product_id, products(title_ar, id))')
      .eq('merchant_id', mid).gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false });

    const total_orders = orders?.length || 0;
    const total_revenue = orders?.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total_amount, 0) || 0;
    const pending_orders = orders?.filter(o => o.status === 'pending').length || 0;
    const confirmed_orders = orders?.filter(o => o.status === 'confirmed').length || 0;
    const shipped_orders = orders?.filter(o => o.status === 'shipped').length || 0;
    const delivered_orders = orders?.filter(o => o.status === 'delivered').length || 0;
    const cancelled_orders = orders?.filter(o => o.status === 'cancelled').length || 0;

    const productMap = {};
    orders?.forEach(order => {
      order.order_items?.forEach(item => {
        const pid = item.product_id;
        if (!productMap[pid]) productMap[pid] = { name: item.products?.title_ar || 'منتج', qty: 0, revenue: 0 };
        productMap[pid].qty += item.quantity;
        productMap[pid].revenue += item.total_price;
      });
    });
    const top_products = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const governorate_map = {};
    orders?.forEach(o => { if (o.governorate) governorate_map[o.governorate] = (governorate_map[o.governorate] || 0) + 1; });

    const { data: most_viewed } = await supabase.from('products').select('title_ar, views, id').eq('merchant_id', mid).eq('is_active', true).order('views', { ascending: false }).limit(5);

    res.json({
      date: reportDate,
      summary: { total_orders, total_revenue, pending_orders, confirmed_orders, shipped_orders, delivered_orders, cancelled_orders, avg_order_value: total_orders > 0 ? (total_revenue / total_orders).toFixed(2) : 0 },
      top_products, most_viewed, governorate_distribution: governorate_map, orders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/monthly', verifyMerchant, async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);
    const mid = req.merchant.id;

    const startDate = `${year}-${String(month).padStart(2,'0')}-01T00:00:00`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2,'0')}-${lastDay}T23:59:59`;

    const { data: orders } = await supabase.from('orders')
      .select('id, order_number, status, total_amount, payment_status, governorate, created_at, order_items(quantity, total_price, product_id, products(title_ar))')
      .eq('merchant_id', mid).gte('created_at', startDate).lte('created_at', endDate);

    const total_revenue = orders?.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total_amount, 0) || 0;
    const total_orders = orders?.length || 0;

    const daily = {};
    for (let d = 1; d <= lastDay; d++) {
      const key = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      daily[key] = { date: key, orders: 0, revenue: 0 };
    }
    orders?.forEach(o => {
      const day = o.created_at.split('T')[0];
      if (daily[day]) { daily[day].orders++; if (o.payment_status === 'paid') daily[day].revenue += o.total_amount; }
    });

    const productMap = {};
    orders?.forEach(o => { o.order_items?.forEach(item => { const pid = item.product_id; if (!productMap[pid]) productMap[pid] = { name: item.products?.title_ar, qty: 0, revenue: 0 }; productMap[pid].qty += item.quantity; productMap[pid].revenue += item.total_price; }); });
    const top_products = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const governorate_map = {};
    orders?.forEach(o => { if (o.governorate) governorate_map[o.governorate] = (governorate_map[o.governorate] || 0) + 1; });

    res.json({
      period: `${year}-${String(month).padStart(2,'0')}`, year, month,
      summary: { total_orders, total_revenue: total_revenue.toFixed(2), delivered: orders?.filter(o => o.status === 'delivered').length || 0, cancelled: orders?.filter(o => o.status === 'cancelled').length || 0, avg_order_value: total_orders > 0 ? (total_revenue / total_orders).toFixed(2) : 0 },
      daily_chart: Object.values(daily), top_products, governorate_distribution: governorate_map
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin', verifyAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [users, merchants, products, allOrders, todayOrders] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('merchants').select('id', { count: 'exact' }),
      supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('orders').select('total_amount, status, payment_status'),
      supabase.from('orders').select('total_amount').gte('created_at', today)
    ]);
    const total_revenue = allOrders.data?.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total_amount, 0) || 0;
    const today_revenue = todayOrders.data?.reduce((s, o) => s + o.total_amount, 0) || 0;
    res.json({ total_users: users.count, total_merchants: merchants.count, total_products: products.count, total_orders: allOrders.data?.length || 0, total_revenue: total_revenue.toFixed(2), today_orders: todayOrders.data?.length || 0, today_revenue: today_revenue.toFixed(2), pending_orders: allOrders.data?.filter(o => o.status === 'pending').length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
