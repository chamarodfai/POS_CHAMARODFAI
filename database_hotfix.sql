-- ================================
-- POS SYSTEM DATABASE SCHEMA - HOTFIX VERSION
-- แก้ไข error: column oi.menu_item_cost does not exist
-- ================================

-- ลบ Views ที่มีปัญหาก่อน
DROP VIEW IF EXISTS order_details CASCADE;
DROP VIEW IF EXISTS monthly_stats CASCADE;
DROP VIEW IF EXISTS yearly_stats CASCADE;

-- แก้ไขตาราง order_items ให้มีคอลัมน์ที่จำเป็น
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS menu_item_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (menu_item_cost >= 0);

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0);

-- แก้ไขตาราง menu_items ให้มีคอลัมน์ cost
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0);

-- เพิ่ม constraint สำหรับกำไร
ALTER TABLE menu_items 
DROP CONSTRAINT IF EXISTS valid_profit;

ALTER TABLE menu_items 
ADD CONSTRAINT valid_profit CHECK (price >= cost);

-- แก้ไขตาราง daily_stats ให้มีคอลัมน์กำไร
ALTER TABLE daily_stats 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0;

ALTER TABLE daily_stats 
ADD COLUMN IF NOT EXISTS gross_profit DECIMAL(12,2) DEFAULT 0;

ALTER TABLE daily_stats 
ADD COLUMN IF NOT EXISTS net_profit DECIMAL(12,2) DEFAULT 0;

ALTER TABLE daily_stats 
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2) DEFAULT 0;

-- อัปเดต Functions ให้ทำงานกับคอลัมน์ใหม่
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

-- สร้าง Views ใหม่ (ตอนนี้ทุกคอลัมน์มีอยู่แล้ว)
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

-- อัปเดตข้อมูลเมนูให้มีต้นทุน (สำหรับข้อมูลที่มีอยู่แล้ว)
UPDATE menu_items SET cost = 
  CASE 
    WHEN name LIKE '%ข้าวผัดกุ้ง%' THEN 45.00
    WHEN name LIKE '%ต้มยำกุ้ง%' THEN 65.00
    WHEN name LIKE '%น้ำส้มคั้น%' THEN 12.00
    WHEN name LIKE '%ข้าวผัดหมู%' THEN 35.00
    WHEN name LIKE '%กาแฟดำ%' THEN 8.00
    WHEN name LIKE '%ผัดไทย%' THEN 40.00
    WHEN name LIKE '%ส้มตำ%' THEN 20.00
    WHEN name LIKE '%ไอศกรีม%' THEN 15.00
    ELSE price * 0.6  -- ประมาณ 60% ของราคาขาย
  END
WHERE cost = 0;

-- ยืนยันการแก้ไข
SELECT 'Hotfix applied successfully!' as status;

-- ตรวจสอบโครงสร้างตาราง
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('menu_items', 'order_items', 'daily_stats')
  AND column_name IN ('cost', 'menu_item_cost', 'total_cost', 'gross_profit', 'net_profit', 'profit_margin')
ORDER BY table_name, column_name;
