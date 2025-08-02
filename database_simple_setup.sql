-- ================================================
-- SIMPLE DATABASE SETUP FOR SUPABASE
-- คัดลอกและรันใน Supabase SQL Editor
-- ================================================

-- สร้างตารางพื้นฐาน
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  category VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  promotion_id UUID REFERENCES promotions(id),
  promotion_name VARCHAR(200),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  order_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  menu_item_name VARCHAR(200) NOT NULL,
  menu_item_price DECIMAL(10,2) NOT NULL CHECK (menu_item_price >= 0),
  menu_item_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (menu_item_cost >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  gross_profit DECIMAL(12,2) DEFAULT 0,
  total_discount DECIMAL(12,2) DEFAULT 0,
  net_profit DECIMAL(12,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO categories (name, description) VALUES
('อาหารจานเดียว', 'ข้าวผัด ข้าวคลุกกะปิ ฯลฯ'),
('ต้มยำ', 'ต้มยำกุ้ง ต้มยำปลา ฯลฯ'),
('เครื่องดื่ม', 'น้ำผลไม้ น้ำอัดลม กาแฟ ฯลฯ'),
('ของหวาน', 'ไอศกรีม เค้ก ฯลฯ')
ON CONFLICT (name) DO NOTHING;

INSERT INTO menu_items (name, price, cost, category, description, available) VALUES
('ข้าวผัดกุ้ง', 80.00, 45.00, 'อาหารจานเดียว', 'ข้าวผัดกุ้งสดใส่ไข่', true),
('ต้มยำกุ้ง', 120.00, 65.00, 'ต้มยำ', 'ต้มยำกุ้งน้ำใส รสเปรียวหวาน', true),
('น้ำส้มคั้น', 30.00, 12.00, 'เครื่องดื่ม', 'น้ำส้มคั้นสด 100%', true),
('ข้าวผัดหมู', 70.00, 35.00, 'อาหารจานเดียว', 'ข้าวผัดหมูใส่ไข่', true),
('กาแฟดำ', 25.00, 8.00, 'เครื่องดื่ม', 'กาแฟดำร้อน', true),
('ผัดไทย', 75.00, 40.00, 'อาหารจานเดียว', 'ผัดไทยกุ้งสด รสชาติต้นตำรับ', true),
('ส้มตำ', 50.00, 20.00, 'อาหารจานเดียว', 'ส้มตำไทย เผ็ดร้อน', true),
('ไอศกรีมวานิลลา', 35.00, 15.00, 'ของหวาน', 'ไอศกรีมวานิลลาเข้มข้น', true)
ON CONFLICT DO NOTHING;

INSERT INTO promotions (name, type, value, description, active, start_date, end_date) VALUES
('ลด 10%', 'percentage', 10.00, 'ลดราคา 10% สำหรับทุกรายการ', true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('ลด 50 บาท', 'fixed', 50.00, 'ลดราคา 50 บาท เมื่อซื้อครบ 300 บาท', true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- ยืนยันการสร้าง
SELECT 'Database setup completed successfully!' as status;

-- ตรวจสอบตารางที่สร้าง
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'menu_items', 'promotions', 'orders', 'order_items', 'daily_stats')
ORDER BY table_name;
