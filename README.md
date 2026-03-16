# سوق مصر - Souq Egypt API

## هيكل الملفات (مهم جداً)
```
marketplace-api/          ← هذا هو الـ repository على GitHub
├── server.js             ← الملف الرئيسي
├── package.json          ← المكتبات
├── railway.json          ← إعدادات Railway
├── .env.example          ← نموذج المتغيرات
├── db/
│   └── supabase.js
├── middleware/
│   └── auth.js
└── routes/
    ├── auth.js
    ├── products.js
    ├── orders.js
    ├── merchants.js
    ├── reports.js
    ├── upload.js
    ├── ads.js
    └── categories.js
```

## خطوات الرفع على GitHub

1. افتح مجلد `souq-egypt` على جهازك
2. ارفع جميع الملفات مباشرة في الـ repository
3. تأكد أن `server.js` و `package.json` في الجذر مباشرة

## Variables على Railway
```
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://kvukejtkdnkctknxdnuy.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=marketplace_secret_key_2024
CLOUDINARY_CLOUD_NAME=dv2jrblup
CLOUDINARY_API_KEY=981263592888672
CLOUDINARY_API_SECRET=your_api_secret
```

## اختبار السيرفر
افتح في المتصفح:
https://marketplace-api-production.up.railway.app

يجب أن يظهر: {"status": "✅ Souq Egypt API Running"}
