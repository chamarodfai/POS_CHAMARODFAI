-- ================================
-- QUICK FIX สำหรับ Supabase Error
-- แก้ไข: column oi.menu_item_cost does not exist
-- ================================

-- 🔧 วิธีแก้ไขแบบง่าย ๆ:

-- 1. รันคำสั่งเหล่านี้ใน Supabase SQL Editor ทีละคำสั่ง:

-- ลบ Views ที่มีปัญหาก่อน
DROP VIEW IF EXISTS order_details CASCADE;

-- เพิ่มคอลัมน์ที่หายไปในตาราง order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS menu_item_cost DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) NOT NULL DEFAULT 0;

-- เพิ่มคอลัมน์ cost ในตาราง menu_items (ถ้ายังไม่มี)
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) NOT NULL DEFAULT 0;

-- สร้าง View ใหม่ (ตอนนี้คอลัมน์มีครบแล้ว)
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

-- ================================
-- หรือใช้วิธีนี้แทน (ถ้าต้องการเริ่มต้นใหม่):
-- ================================

-- ลบทุกอย่างแล้วสร้างใหม่
-- รันคำสั่งเหล่านี้ทีละคำสั่ง:

/*
-- 1. ลบ Views ทั้งหมด
DROP VIEW IF EXISTS order_details CASCADE;
DROP VIEW IF EXISTS monthly_stats CASCADE;
DROP VIEW IF EXISTS yearly_stats CASCADE;

-- 2. ลบ Functions และ Triggers
DROP FUNCTION IF EXISTS get_top_selling_items CASCADE;
DROP FUNCTION IF EXISTS get_sales_by_category CASCADE;
DROP FUNCTION IF EXISTS get_profit_analysis CASCADE;
DROP FUNCTION IF EXISTS get_most_profitable_items CASCADE;

-- 3. ลบตารางทั้งหมด
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 4. รัน database_schema_fixed.sql ใหม่ทั้งหมด
*/

-- ================================
-- การตรวจสอบ
-- ================================

-- ตรวจสอบว่าคอลัมน์ถูกเพิ่มแล้ว
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'order_items'
  AND column_name IN ('menu_item_cost', 'total_cost')
ORDER BY column_name;

-- ถ้าเห็น 2 แถว แสดงว่าเพิ่มคอลัมน์สำเร็จแล้ว

SELECT 'Quick fix completed! ✅' as status;
