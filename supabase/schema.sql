-- 1953형제돼지국밥 프랜차이즈 플랫폼 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하거나 마이그레이션으로 적용

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Supabase automatically manages JWT secrets, so no manual configuration is needed
-- Row Level Security will be enabled for each table below

-- ============================================
-- 1. 프랜차이즈 (Franchises)
-- ============================================
CREATE TABLE IF NOT EXISTS franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  region VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT franchises_code_unique UNIQUE (code)
);

-- ============================================
-- 2. 매장 (Stores)
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  region VARCHAR(100) NOT NULL,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stores_franchise_code_unique UNIQUE (franchise_id, code)
);

-- ============================================
-- 3. 사용자 (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'STAFF')),
  franchise_id UUID REFERENCES franchises(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  name VARCHAR(100),
  position VARCHAR(100),
  store_name VARCHAR(255),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- ============================================
-- 4. 상품 카테고리 (Product Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. 상품 (Products)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  uom VARCHAR(50) NOT NULL, -- Unit of Measure (단위)
  weight_grams INTEGER CHECK (weight_grams >= 0),
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  is_shippable BOOLEAN NOT NULL DEFAULT true,
  lead_time_days INTEGER CHECK (lead_time_days >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_sku_unique UNIQUE (sku)
);

-- ============================================
-- 6. 주문 (Orders)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  order_code VARCHAR(20) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
  vat_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_method VARCHAR(100),
  shipping_address TEXT NOT NULL,
  delivery_date DATE,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. 주문 품목 (Order Items)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ALLOCATED', 'SHIPPED', 'CANCELLED')),
  qty_allocated INTEGER NOT NULL DEFAULT 0 CHECK (qty_allocated >= 0),
  qty_shipped INTEGER NOT NULL DEFAULT 0 CHECK (qty_shipped >= 0),
  qty_cancelled INTEGER NOT NULL DEFAULT 0 CHECK (qty_cancelled >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. 공지사항 (Notices)
-- ============================================
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  audience VARCHAR(20) NOT NULL CHECK (audience IN ('ALL', 'FRANCHISEE', 'STAFF')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. 공지사항 읽음 상태 (Notice Reads)
-- ============================================
CREATE TABLE IF NOT EXISTS notice_reads (
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notice_id, user_id)
);

-- ============================================
-- 10. 품질 점검 체크리스트 (Quality Checklists)
-- ============================================
CREATE TABLE IF NOT EXISTS quality_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. 품질 점검 항목 (Quality Items)
-- ============================================
CREATE TABLE IF NOT EXISTS quality_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES quality_checklists(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  "order" INTEGER NOT NULL CHECK ("order" >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 12. 품질 점검 기록 (Quality Records)
-- ============================================
CREATE TABLE IF NOT EXISTS quality_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES quality_checklists(id) ON DELETE RESTRICT,
  checklist_version INTEGER NOT NULL,
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE RESTRICT,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  completed_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 13. 품질 점검 기록 항목 (Quality Record Items)
-- ============================================
CREATE TABLE IF NOT EXISTS quality_record_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID NOT NULL REFERENCES quality_records(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES quality_items(id) ON DELETE RESTRICT,
  status VARCHAR(10) NOT NULL CHECK (status IN ('PASS', 'FAIL', 'N/A')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 14. 교육 자료 (Training Materials)
-- ============================================
CREATE TABLE IF NOT EXISTS training_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('PDF', 'VIDEO', 'LINK', 'IMAGE')),
  media_url TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 15. 결제 로그 (Payment Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider VARCHAR(100) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_logs_transaction_unique UNIQUE (provider, transaction_id)
);

-- ============================================
-- 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stores_franchise_id ON stores(franchise_id);
CREATE INDEX IF NOT EXISTS idx_users_franchise_id ON users(franchise_id);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_franchise_id ON orders(franchise_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_notices_audience ON notices(audience);
CREATE INDEX IF NOT EXISTS idx_notices_published_at ON notices(published_at);
CREATE INDEX IF NOT EXISTS idx_notices_is_pinned ON notices(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notice_reads_user_id ON notice_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_quality_items_checklist_id ON quality_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_quality_records_franchise_id ON quality_records(franchise_id);
CREATE INDEX IF NOT EXISTS idx_quality_records_store_id ON quality_records(store_id);
CREATE INDEX IF NOT EXISTS idx_quality_records_date ON quality_records(date);
CREATE INDEX IF NOT EXISTS idx_quality_record_items_record_id ON quality_record_items(record_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);

-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================
-- RLS 활성화
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_record_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- 기본 정책 예시 (실제 요구사항에 맞게 수정 필요)
-- 모든 사용자는 자신의 정보를 볼 수 있음
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- OWNER/STAFF는 자신의 프랜차이즈 정보를 볼 수 있음
CREATE POLICY "Franchise users can view own franchise" ON franchises
  FOR SELECT USING (
    id IN (SELECT franchise_id FROM users WHERE id = auth.uid())
  );

-- OWNER/STAFF는 자신의 매장 정보를 볼 수 있음
CREATE POLICY "Store users can view own stores" ON stores
  FOR SELECT USING (
    franchise_id IN (SELECT franchise_id FROM users WHERE id = auth.uid())
  );

-- 모든 사용자는 활성화된 상품을 볼 수 있음
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

-- ADMIN은 모든 상품을 볼 수 있음
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- OWNER/STAFF는 자신의 주문을 볼 수 있음
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    franchise_id IN (SELECT franchise_id FROM users WHERE id = auth.uid())
  );

-- OWNER/STAFF는 주문을 생성할 수 있음
CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (
    franchise_id IN (SELECT franchise_id FROM users WHERE id = auth.uid())
  );

-- 공지사항은 대상에 맞는 사용자가 볼 수 있음
CREATE POLICY "Users can view relevant notices" ON notices
  FOR SELECT USING (
    audience = 'ALL' OR
    (audience = 'FRANCHISEE' AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )) OR
    (audience = 'STAFF' AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'STAFF'
    ))
  );

-- ============================================
-- 트리거 함수: updated_at 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_checklists_updated_at
  BEFORE UPDATE ON quality_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_materials_updated_at
  BEFORE UPDATE ON training_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

