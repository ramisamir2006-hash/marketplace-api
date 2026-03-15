// ============================================================
// FILE 12: backend/routes/upload.js
// رفع الصور والفيديوهات على Cloudinary
// ============================================================

const express    = require('express');
const router     = express.Router();
const cloudinary = require('cloudinary').v2;
const { verifyToken } = require('../middleware/auth');

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET
});

// POST /api/upload/image — رفع صورة
router.post('/image', verifyToken, async (req, res) => {
  try {
    const { base64, folder = 'products' } = req.body;
    if (!base64) return res.status(400).json({ error: 'الصورة مطلوبة' });

    const result = await cloudinary.uploader.upload(base64, {
      folder:        `marketplace/${folder}`,
      resource_type: 'image',
      quality:       'auto:good',
      fetch_format:  'auto',
      width:         1200,
      crop:          'limit'
    });

    res.json({
      url:       result.secure_url,
      public_id: result.public_id,
      width:     result.width,
      height:    result.height
    });
  } catch (err) {
    res.status(500).json({ error: 'فشل رفع الصورة: ' + err.message });
  }
});

// POST /api/upload/multiple — رفع صور متعددة
router.post('/multiple', verifyToken, async (req, res) => {
  try {
    const { images, folder = 'products' } = req.body;
    if (!images || !images.length)
      return res.status(400).json({ error: 'الصور مطلوبة' });

    const uploads = await Promise.all(
      images.map(base64 =>
        cloudinary.uploader.upload(base64, {
          folder:        `marketplace/${folder}`,
          resource_type: 'image',
          quality:       'auto:good',
          fetch_format:  'auto'
        })
      )
    );

    res.json({ urls: uploads.map(u => u.secure_url) });
  } catch (err) {
    res.status(500).json({ error: 'فشل رفع الصور: ' + err.message });
  }
});

// POST /api/upload/video — رفع فيديو
router.post('/video', verifyToken, async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ error: 'الفيديو مطلوب' });

    const result = await cloudinary.uploader.upload(base64, {
      resource_type: 'video',
      folder:        'marketplace/videos',
      quality:       'auto:good'
    });

    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    res.status(500).json({ error: 'فشل رفع الفيديو: ' + err.message });
  }
});

// POST /api/upload/avatar — رفع صورة شخصية
router.post('/avatar', verifyToken, async (req, res) => {
  try {
    const { base64 } = req.body;
    const result = await cloudinary.uploader.upload(base64, {
      folder:         'marketplace/avatars',
      resource_type:  'image',
      transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }]
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/upload/:public_id — حذف ملف
router.delete('/:public_id', verifyToken, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(
      decodeURIComponent(req.params.public_id)
    );
    res.json({ message: 'تم حذف الملف بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
