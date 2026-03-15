// ============================================================
// FILE 5: backend/middleware/auth.js
// التحقق من الهوية - JWT Middleware
// ============================================================

const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');

// تحقق من التوكن
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'لم يتم تقديم رمز التوثيق' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'رمز التوثيق غير صالح أو منتهي' });
  }
};

// تحقق أن المستخدم تاجر
const verifyMerchant = async (req, res, next) => {
  verifyToken(req, res, async () => {
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, is_active')
      .eq('user_id', req.user.id)
      .single();

    if (!merchant)
      return res.status(403).json({ error: 'يجب أن تكون تاجراً للقيام بهذا الإجراء' });
    if (!merchant.is_active)
      return res.status(403).json({ error: 'حساب التاجر غير نشط' });

    req.merchant = merchant;
    next();
  });
};

// تحقق أن المستخدم مدير
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'هذا الإجراء للمديرين فقط' });
    next();
  });
};

module.exports = { verifyToken, verifyMerchant, verifyAdmin };
