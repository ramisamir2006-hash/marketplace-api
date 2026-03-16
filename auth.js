const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');
const { verifyToken } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, role = 'buyer' } = req.body;
    if (!email || !password || !full_name)
      return res.status(400).json({ error: 'البريد وكلمة المرور والاسم مطلوبة' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from('users')
      .insert([{ email: email.toLowerCase().trim(), password: hashedPassword, full_name, phone, role }])
      .select('id, email, full_name, phone, role, created_at')
      .single();

    if (error) {
      if (error.message.includes('unique'))
        return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
      return res.status(400).json({ error: error.message });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ user, token, message: 'تم إنشاء الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبان' });

    const { data: user, error } = await supabase
      .from('users').select('*').eq('email', email.toLowerCase().trim()).single();

    if (error || !user)
      return res.status(401).json({ error: 'بيانات غير صحيحة' });

    if (!user.is_active)
      return res.status(403).json({ error: 'الحساب موقوف' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: 'بيانات غير صحيحة' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token, message: 'تم تسجيل الدخول' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, phone, avatar_url, address, governorate, country, role, created_at, merchants(*)')
      .eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

module.exports = router;
