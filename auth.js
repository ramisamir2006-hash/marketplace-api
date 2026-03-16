const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');

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
    return res.status(401).json({ error: 'رمز التوثيق غير صالح' });
  }
};

const verifyMerchant = async (req, res, next) => {
  verifyToken(req, res, async () => {
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, is_active')
      .eq('user_id', req.user.id)
      .single();

    if (!merchant)
      return res.status(403).json({ error: 'يجب أن تكون تاجراً' });

    req.merchant = merchant;
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'للمديرين فقط' });
    next();
  });
};

module.exports = { verifyToken, verifyMerchant, verifyAdmin };
