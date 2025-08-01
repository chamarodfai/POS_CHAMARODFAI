-- ================================
-- POS SYSTEM DATABASE SCHEMA - FIXED VERSION
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
  cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  category VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_profit CHECK (price >= cost)
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
  menu_item_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (menu_item_cost >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ตารางสำหรับเก็บข้อมูลสถิติรายวัน (Daily Statistics)
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

-- ================================
-- INDEXES สำหรับประสิทธิภาพ
-- ================================

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_time ON orders(order_time);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date);

-- ================================
-- FUNCTIONS และ TRIGGERS
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
CREATE OR REPLACE TRIGGER update_menu_items_updated_at 
  BEFORE UPDATE ON menu_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_promotions_updated_at 
  BEFORE UPDATE ON promotions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_daily_stats_updated_at 
  BEFORE UPDATE ON daily_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function สำหรับอัปเดตสถิติรายวัน (รวมกำไร)
CREATE OR REPLACE FUNCTION update_daily_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_stats (
    stat_date,
    total_orders,
    total_revenue,
    total_cost,
    gross_profit,
    total_discount,
    net_profit,
    avg_order_value,
    profit_margin
  )
  SELECT 
    target_date,
    COUNT(*) as total_orders,
    COALESCE(SUM(o.total), 0) as total_revenue,
    COALESCE(SUM(
      (SELECT SUM(oi.total_cost) FROM order_items oi WHERE oi.order_id = o.id)
    ), 0) as total_cost,
    COALESCE(SUM(o.total), 0) - COALESCE(SUM(
      (SELECT SUM(oi.total_cost) FROM order_items oi WHERE oi.order_id = o.id)
    ), 0) as gross_profit,
    COALESCE(SUM(o.discount), 0) as total_discount,
    COALESCE(SUM(o.total), 0) - COALESCE(SUM(
      (SELECT SUM(oi.total_cost) FROM order_items oi WHERE oi.order_id = o.id)
    ), 0) - COALESCE(SUM(o.discount), 0) as net_profit,
    COALESCE(AVG(o.total), 0) as avg_order_value,
    CASE 
      WHEN SUM(o.total) > 0 THEN 
        ((SUM(o.total) - COALESCE(SUM(
          (SELECT SUM(oi.total_cost) FROM order_items oi WHERE oi.order_id = o.id)
        ), 0)) / SUM(o.total)) * 100
      ELSE 0 
    END as profit_margin
  FROM orders o
  WHERE o.order_date = target_date
  ON CONFLICT (stat_date) 
  DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_revenue = EXCLUDED.total_revenue,
    total_cost = EXCLUDED.total_cost,
    gross_profit = EXCLUDED.gross_profit,
    total_discount = EXCLUDED.total_discount,
    net_profit = EXCLUDED.net_profit,
    avg_order_value = EXCLUDED.avg_order_value,
    profit_margin = EXCLUDED.profit_margin,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับดึงข้อมูลขายดี
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

-- Function สำหรับดึงข้อมูลยอดขายตามหมวดหมู่ (รวมกำไร)
CREATE OR REPLACE FUNCTION get_sales_by_category(
  start_date DATE DEFAULT CURRENT_DATE - 7,
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  category VARCHAR(100),
  total_quantity BIGINT,
  total_revenue DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  gross_profit DECIMAL(12,2),
  profit_margin DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mi.category,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_revenue,
    SUM(oi.total_cost) as total_cost,
    SUM(oi.subtotal) - SUM(oi.total_cost) as gross_profit,
    CASE 
      WHEN SUM(oi.subtotal) > 0 THEN 
        ((SUM(oi.subtotal) - SUM(oi.total_cost)) / SUM(oi.subtotal)) * 100
      ELSE 0 
    END as profit_margin
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
  WHERE o.order_date BETWEEN start_date AND end_date
  GROUP BY mi.category
  ORDER BY gross_profit DESC;
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับวิเคราะห์กำไรขาดทุน
CREATE OR REPLACE FUNCTION get_profit_analysis(
  start_date DATE DEFAULT CURRENT_DATE - 30,
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  analysis_period TEXT,
  total_revenue DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  gross_profit DECIMAL(12,2),
  total_discount DECIMAL(12,2),
  net_profit DECIMAL(12,2),
  profit_margin DECIMAL(5,2),
  loss_days INTEGER,
  profitable_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    start_date::TEXT || ' to ' || end_date::TEXT as analysis_period,
    SUM(ds.total_revenue) as total_revenue,
    SUM(ds.total_cost) as total_cost,
    SUM(ds.gross_profit) as gross_profit,
    SUM(ds.total_discount) as total_discount,
    SUM(ds.net_profit) as net_profit,
    CASE 
      WHEN SUM(ds.total_revenue) > 0 THEN 
        (SUM(ds.gross_profit) / SUM(ds.total_revenue)) * 100
      ELSE 0 
    END as profit_margin,
    COUNT(CASE WHEN ds.net_profit < 0 THEN 1 END)::INTEGER as loss_days,
    COUNT(CASE WHEN ds.net_profit > 0 THEN 1 END)::INTEGER as profitable_days
  FROM daily_stats ds
  WHERE ds.stat_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับหาเมนูที่ให้กำไรมากที่สุด
CREATE OR REPLACE FUNCTION get_most_profitable_items(
  days_back INTEGER DEFAULT 7,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  menu_item_name VARCHAR(200),
  total_quantity BIGINT,
  total_revenue DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  gross_profit DECIMAL(12,2),
  profit_per_unit DECIMAL(10,2),
  profit_margin DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.menu_item_name,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_revenue,
    SUM(oi.total_cost) as total_cost,
    SUM(oi.subtotal) - SUM(oi.total_cost) as gross_profit,
    (SUM(oi.subtotal) - SUM(oi.total_cost)) / SUM(oi.quantity) as profit_per_unit,
    CASE 
      WHEN SUM(oi.subtotal) > 0 THEN 
        ((SUM(oi.subtotal) - SUM(oi.total_cost)) / SUM(oi.subtotal)) * 100
      ELSE 0 
    END as profit_margin
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.order_date >= CURRENT_DATE - days_back
  GROUP BY oi.menu_item_name
  ORDER BY gross_profit DESC, profit_margin DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับอัปเดตสถิติเมื่อมีออเดอร์ใหม่
CREATE OR REPLACE FUNCTION trigger_update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_daily_stats(NEW.order_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger สำหรับอัปเดตสถิติอัตโนมัติ
CREATE OR REPLACE TRIGGER trigger_orders_stats
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_update_daily_stats();

-- ================================
-- VIEWS สำหรับรายงาน
-- ================================

-- View สำหรับออเดอร์พร้อมรายละเอียด (รวมกำไร)
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
  oi.menu_item_cost,
  oi.quantity,
  oi.subtotal as item_subtotal,
  oi.total_cost as item_total_cost,
  (oi.subtotal - oi.total_cost) as item_profit,
  CASE 
    WHEN oi.subtotal > 0 THEN 
      ((oi.subtotal - oi.total_cost) / oi.subtotal) * 100
    ELSE 0 
  END as item_profit_margin
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
ORDER BY o.order_time DESC, oi.menu_item_name;

-- View สำหรับสถิติรายเดือน (รวมกำไร)
CREATE OR REPLACE VIEW monthly_stats AS
SELECT 
  DATE_TRUNC('month', stat_date) as month,
  SUM(total_orders) as total_orders,
  SUM(total_revenue) as total_revenue,
  SUM(total_cost) as total_cost,
  SUM(gross_profit) as gross_profit,
  SUM(total_discount) as total_discount,
  SUM(net_profit) as net_profit,
  AVG(avg_order_value) as avg_order_value,
  AVG(profit_margin) as avg_profit_margin
FROM daily_stats
GROUP BY DATE_TRUNC('month', stat_date)
ORDER BY month DESC;

-- View สำหรับสถิติรายปี (รวมกำไร)
CREATE OR REPLACE VIEW yearly_stats AS
SELECT 
  DATE_TRUNC('year', stat_date) as year,
  SUM(total_orders) as total_orders,
  SUM(total_revenue) as total_revenue,
  SUM(total_cost) as total_cost,
  SUM(gross_profit) as gross_profit,
  SUM(total_discount) as total_discount,
  SUM(net_profit) as net_profit,
  AVG(avg_order_value) as avg_order_value,
  AVG(profit_margin) as avg_profit_margin
FROM daily_stats
GROUP BY DATE_TRUNC('year', stat_date)
ORDER BY year DESC;

-- ================================
-- ข้อมูลตัวอย่าง
-- ================================

-- เพิ่มหมวดหมู่ตัวอย่าง
INSERT INTO categories (name, description) VALUES
('อาหารจานเดียว', 'ข้าวผัด ข้าวคลุกกะปิ ฯลฯ'),
('ต้มยำ', 'ต้มยำกุ้ง ต้มยำปลา ฯลฯ'),
('เครื่องดื่ม', 'น้ำผลไม้ น้ำอัดลม กาแฟ ฯลฯ'),
('ของหวาน', 'ไอศกรีม เค้ก ฯลฯ')
ON CONFLICT (name) DO NOTHING;

-- เพิ่มเมนูตัวอย่าง (รวมต้นทุน)
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

-- เพิ่มโปรโมชั่นตัวอย่าง
INSERT INTO promotions (name, type, value, description, active, start_date, end_date) VALUES
('ลด 10%', 'percentage', 10.00, 'ลดราคา 10% สำหรับทุกรายการ', true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('ลด 50 บาท', 'fixed', 50.00, 'ลดราคา 50 บาท เมื่อซื้อครบ 300 บาท', true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- แสดงข้อความยืนยัน
SELECT 'Database schema created successfully!' as status;
SELECT 'Tables created: ' || count(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'menu_items', 'promotions', 'orders', 'order_items', 'daily_stats');

-- ================================
-- ตัวอย่างการใช้งาน Functions กำไร
-- ================================

-- ตัวอย่างการดูวิเคราะห์กำไร 30 วันล่าสุด
-- SELECT * FROM get_profit_analysis(CURRENT_DATE - 30, CURRENT_DATE);

-- ตัวอย่างการดูเมนูที่ให้กำไรมากที่สุด
-- SELECT * FROM get_most_profitable_items(7, 5);

-- ตัวอย่างการดูกำไรตามหมวดหมู่
-- SELECT * FROM get_sales_by_category(CURRENT_DATE - 7, CURRENT_DATE);

-- ตัวอย่างการดูข้อมูลกำไรรายวัน
-- SELECT 
--   stat_date,
--   total_revenue,
--   total_cost,
--   gross_profit,
--   profit_margin || '%' as profit_percentage
-- FROM daily_stats 
-- ORDER BY stat_date DESC 
-- LIMIT 10;
