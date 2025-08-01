-- ================================
-- POS SYSTEM DATABASE SCHEMA
-- สำหรับ Supabase PostgreSQL
-- ================================

-- 1. ตารางหมวดหมู่เมนู (Categories)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ตารางเมนูอาหาร (Menu Items)
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ตารางโปรโมชั่น (Promotions)
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10,2) NOT NULL CHECK (value >= 0),
  description TEXT,
  min_amount DECIMAL(10,2) CHECK (min_amount >= 0),
  active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_percentage CHECK (
    (type = 'percentage' AND value <= 100) OR type = 'fixed'
  )
);

-- 4. ตารางออเดอร์ (Orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  promotion_id UUID REFERENCES promotions(id),
  promotion_name VARCHAR(200),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  order_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ตารางรายการในออเดอร์ (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  menu_item_name VARCHAR(200) NOT NULL,
  menu_item_price DECIMAL(10,2) NOT NULL CHECK (menu_item_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ตารางสำหรับเก็บข้อมูลสถิติรายวัน (Daily Statistics)
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_discount DECIMAL(12,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES สำหรับประสิทธิภาพ
-- ================================

-- Index สำหรับการค้นหาเมนูตามหมวดหมู่
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);

-- Index สำหรับการค้นหาโปรโมชั่นที่ใช้งานได้
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);

-- Index สำหรับการค้นหาออเดอร์ตามวันที่
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_time ON orders(order_time);

-- Index สำหรับ order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Index สำหรับ daily_stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date);

-- ================================
-- TRIGGERS สำหรับ AUTO UPDATE
-- ================================

-- Function สำหรับอัปเดต updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers สำหรับ updated_at
CREATE TRIGGER update_menu_items_updated_at 
  BEFORE UPDATE ON menu_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at 
  BEFORE UPDATE ON promotions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at 
  BEFORE UPDATE ON daily_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- FUNCTIONS สำหรับการคำนวณสถิติ
-- ================================

-- Function สำหรับอัปเดตสถิติรายวัน
CREATE OR REPLACE FUNCTION update_daily_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_stats (
    stat_date,
    total_orders,
    total_revenue,
    total_discount,
    avg_order_value
  )
  SELECT 
    target_date,
    COUNT(*) as total_orders,
    COALESCE(SUM(total), 0) as total_revenue,
    COALESCE(SUM(discount), 0) as total_discount,
    COALESCE(AVG(total), 0) as avg_order_value
  FROM orders 
  WHERE order_date = target_date
  ON CONFLICT (stat_date) 
  DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_revenue = EXCLUDED.total_revenue,
    total_discount = EXCLUDED.total_discount,
    avg_order_value = EXCLUDED.avg_order_value,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับดึงข้อมูลขายดี (Top selling items)
CREATE OR REPLACE FUNCTION get_top_selling_items(
  days_back INTEGER DEFAULT 7,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  menu_item_name VARCHAR(200),
  total_quantity BIGINT,
  total_revenue DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.menu_item_name,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_revenue
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.order_date >= CURRENT_DATE - days_back
  GROUP BY oi.menu_item_name
  ORDER BY total_quantity DESC, total_revenue DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับดึงข้อมูลยอดขายตามหมวดหมู่
CREATE OR REPLACE FUNCTION get_sales_by_category(
  start_date DATE DEFAULT CURRENT_DATE - 7,
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  category VARCHAR(100),
  total_quantity BIGINT,
  total_revenue DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mi.category,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_revenue
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
  WHERE o.order_date BETWEEN start_date AND end_date
  GROUP BY mi.category
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- TRIGGER สำหรับอัปเดตสถิติอัตโนมัติ
-- ================================

-- Function สำหรับอัปเดตสถิติเมื่อมีออเดอร์ใหม่
CREATE OR REPLACE FUNCTION trigger_update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- อัปเดตสถิติสำหรับวันที่ของออเดอร์
  PERFORM update_daily_stats(NEW.order_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger สำหรับอัปเดตสถิติเมื่อมีออเดอร์ใหม่หรือแก้ไข
CREATE TRIGGER trigger_orders_stats
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_update_daily_stats();

-- ================================
-- ข้อมูลตัวอย่าง (Sample Data)
-- ================================

-- เพิ่มหมวดหมู่ตัวอย่าง
INSERT INTO categories (name, description) VALUES
('อาหารจานเดียว', 'ข้าวผัด ข้าวคลุกกะปิ ฯลฯ'),
('ต้มยำ', 'ต้มยำกุ้ง ต้มยำปลา ฯลฯ'),
('เครื่องดื่ม', 'น้ำผลไม้ น้ำอัดลม กาแฟ ฯลฯ'),
('ของหวาน', 'ไอศกรีม เค้ก ฯลฯ')
ON CONFLICT (name) DO NOTHING;

-- เพิ่มเมนูตัวอย่าง
INSERT INTO menu_items (name, price, category, description, available) VALUES
('ข้าวผัดกุ้ง', 80.00, 'อาหารจานเดียว', 'ข้าวผัดกุ้งสดใส่ไข่', true),
('ต้มยำกุ้ง', 120.00, 'ต้มยำ', 'ต้มยำกุ้งน้ำใส รสเปรียวหวาน', true),
('น้ำส้มคั้น', 30.00, 'เครื่องดื่ม', 'น้ำส้มคั้นสด 100%', true),
('ข้าวผัดหมู', 70.00, 'อาหารจานเดียว', 'ข้าวผัดหมูใส่ไข่', true),
('กาแฟดำ', 25.00, 'เครื่องดื่ม', 'กาแฟดำร้อน', true)
ON CONFLICT DO NOTHING;

-- เพิ่มโปรโมชั่นตัวอย่าง
INSERT INTO promotions (name, type, value, description, active, start_date, end_date) VALUES
('ลด 10%', 'percentage', 10.00, 'ลดราคา 10% สำหรับทุกรายการ', true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('ลด 50 บาท', 'fixed', 50.00, 'ลดราคา 50 บาท เมื่อซื้อครบ 300 บาท', true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- ================================
-- SECURITY (RLS - Row Level Security)
-- ================================

-- เปิดใช้งาน RLS (ถ้าต้องการ)
-- ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- สร้าง policies (ถ้าต้องการ)
-- CREATE POLICY "Anyone can read menu items" ON menu_items FOR SELECT USING (true);
-- CREATE POLICY "Anyone can read promotions" ON promotions FOR SELECT USING (true);

-- ================================
-- VIEWS สำหรับรายงาน
-- ================================

-- View สำหรับออเดอร์พร้อมรายละเอียด
CREATE OR REPLACE VIEW order_details AS
SELECT 
  o.id as order_id,
  o.order_date,
  o.order_time,
  o.subtotal,
  o.discount,
  o.total,
  o.promotion_name,
  oi.menu_item_name,
  oi.menu_item_price,
  oi.quantity,
  oi.subtotal as item_subtotal
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
ORDER BY o.order_time DESC, oi.menu_item_name;

-- View สำหรับสถิติรายเดือน
CREATE OR REPLACE VIEW monthly_stats AS
SELECT 
  DATE_TRUNC('month', stat_date) as month,
  SUM(total_orders) as total_orders,
  SUM(total_revenue) as total_revenue,
  SUM(total_discount) as total_discount,
  AVG(avg_order_value) as avg_order_value
FROM daily_stats
GROUP BY DATE_TRUNC('month', stat_date)
ORDER BY month DESC;

-- View สำหรับสถิติรายปี
CREATE OR REPLACE VIEW yearly_stats AS
SELECT 
  DATE_TRUNC('year', stat_date) as year,
  SUM(total_orders) as total_orders,
  SUM(total_revenue) as total_revenue,
  SUM(total_discount) as total_discount,
  AVG(avg_order_value) as avg_order_value
FROM daily_stats
GROUP BY DATE_TRUNC('year', stat_date)
ORDER BY year DESC;
