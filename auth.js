// ============================================================
// FILE 6: backend/routes/auth.js
// مسارات التسجيل والدخول
// ============================================================

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../db/supabase');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/register — تسجيل مستخدم جديد
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, role = 'buyer' } = req.body;

    if (!email || !password || !full_name)
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور والاسم مطلوبة' });

    if (password.length < 6)
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, full_name, phone, role }])
      .select('id, email, full_name, phone, role, created_at')
      .single();

    if (error) {
      if (error.message.includes('unique'))
        return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
      return res.status(400).json({ error: error.message });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ user, token, message: 'تم إنشاء الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login — تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user)
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

    if (!user.is_active)
      return res.status(403).json({ error: 'الحساب موقوف، تواصل مع الدعم' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token, message: 'تم تسجيل الدخول بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — بيانات المستخدم الحالي
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, phone, avatar_url, address, governorate, country, role, created_at, merchants(*)')
      .eq('id', req.user.id)
      .single();

    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/update-profile — تحديث الملف الشخصي
router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const { full_name, phone, address, governorate, avatar_url } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ full_name, phone, address, governorate, avatar_url })
      .eq('id', req.user.id)
      .select('id, email, full_name, phone, avatar_url, address, governorate, role')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data, message: 'تم تحديث الملف الشخصي' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/change-password — تغيير كلمة المرور
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    const { data: user } = await supabase
      .from('users').select('password').eq('id', req.user.id).single();

    const valid = await bcrypt.compare(old_password, user.password);
    if (!valid) return res.status(400).json({ error: 'كلمة المرور القديمة غير صحيحة' });

    const hashed = await bcrypt.hash(new_password, 12);
    await supabase.from('users').update({ password: hashed }).eq('id', req.user.id);

    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
