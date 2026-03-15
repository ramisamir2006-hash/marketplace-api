// ============================================================
// FILE 4: backend/db/supabase.js
// اتصال قاعدة البيانات
// ============================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;


/* ============================================================
   قاعدة البيانات الكاملة - انسخ هذا الكود في Supabase SQL Editor
   الرابط: supabase.com → مشروعك → SQL Editor → New Query
   ============================================================

-- ① جدول المستخدمين
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  password     TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  phone        TEXT,
  avatar_url   TEXT,
  address      TEXT,
  governorate  TEXT,
  country      TEXT DEFAULT 'EG',
  role         TEXT DEFAULT 'buyer',  -- buyer | merchant | admin
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ② جدول التجار
CREATE TABLE merchants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  store_name        TEXT NOT NULL,
  store_description TEXT,
  store_logo        TEXT,
  store_banner      TEXT,
  store_phone       TEXT,
  store_email       TEXT,
  governorate       TEXT,
  country           TEXT DEFAULT 'EG',
  is_verified       BOOLEAN DEFAULT false,
  is_active         BOOLEAN DEFAULT true,
  rating            DECIMAL DEFAULT 0,
  total_sales       INTEGER DEFAULT 0,
  national_id       TEXT,
  bank_account      TEXT,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- ③ جدول التصنيفات
CREATE TABLE categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar   TEXT NOT NULL,
  name_en   TEXT,
  icon      TEXT,
  parent_id UUID REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- ④ جدول المنتجات
CREATE TABLE products (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id            UUID REFERENCES merchants(id) ON DELETE CASCADE,
  category_id            UUID REFERENCES categories(id),
  title_ar               TEXT NOT NULL,
  title_en               TEXT,
  description_ar         TEXT,
  description_en         TEXT,
  price                  DECIMAL NOT NULL,
  original_price         DECIMAL,
  currency               TEXT DEFAULT 'EGP',
  stock                  INTEGER DEFAULT 0,
  images                 TEXT[] DEFAULT '{}',
  video_url              TEXT,
  shipping_governorates  TEXT[] DEFAULT '{}',
  shipping_countries     TEXT[] DEFAULT '{}',
  shipping_cost          DECIMAL DEFAULT 0,
  is_active              BOOLEAN DEFAULT true,
  is_featured            BOOLEAN DEFAULT false,
  views                  INTEGER DEFAULT 0,
  rating                 DECIMAL DEFAULT 0,
  total_reviews          INTEGER DEFAULT 0,
  tags                   TEXT[] DEFAULT '{}',
  created_at             TIMESTAMP DEFAULT NOW()
);

-- ⑤ جدول الطلبات
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT UNIQUE NOT NULL,
  buyer_id         UUID REFERENCES users(id),
  merchant_id      UUID REFERENCES merchants(id),
  status           TEXT DEFAULT 'pending',
  total_amount     DECIMAL NOT NULL,
  shipping_cost    DECIMAL DEFAULT 0,
  payment_method   TEXT,
  payment_status   TEXT DEFAULT 'unpaid',
  shipping_address TEXT,
  governorate      TEXT,
  country          TEXT DEFAULT 'EG',
  notes            TEXT,
  tracking_number  TEXT,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- ⑥ جدول عناصر الطلب
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  quantity    INTEGER NOT NULL,
  unit_price  DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL
);

-- ⑦ جدول التقييمات
CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_id   UUID REFERENCES users(id),
  rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  images     TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ⑧ جدول الإعلانات
CREATE TABLE advertisements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  brand_name       TEXT,
  image_url        TEXT NOT NULL,
  video_url        TEXT,
  link_url         TEXT,
  position         TEXT DEFAULT 'banner',
  is_international BOOLEAN DEFAULT false,
  country_target   TEXT[] DEFAULT '{}',
  start_date       TIMESTAMP,
  end_date         TIMESTAMP,
  views            INTEGER DEFAULT 0,
  clicks           INTEGER DEFAULT 0,
  price_paid       DECIMAL DEFAULT 0,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ⑨ جدول الإشعارات
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT,
  is_read    BOOLEAN DEFAULT false,
  data       JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ⑩ جدول المفضلة
CREATE TABLE wishlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Indexes للأداء السريع
CREATE INDEX idx_products_merchant  ON products(merchant_id);
CREATE INDEX idx_products_category  ON products(category_id);
CREATE INDEX idx_products_active    ON products(is_active);
CREATE INDEX idx_orders_buyer       ON orders(buyer_id);
CREATE INDEX idx_orders_merchant    ON orders(merchant_id);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_created     ON orders(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- تصنيفات افتراضية
INSERT INTO categories (name_ar, name_en, icon) VALUES
  ('إلكترونيات',    'Electronics',   'phone-portrait'),
  ('ملابس',         'Fashion',        'shirt'),
  ('أجهزة منزلية', 'Home Appliances','home'),
  ('إكسسوارات',    'Accessories',    'diamond'),
  ('عطور',          'Perfumes',       'flower'),
  ('رياضة',         'Sports',         'football'),
  ('كتب',           'Books',          'book'),
  ('ألعاب أطفال',  'Kids Toys',      'game-controller');

*/
