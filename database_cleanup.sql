-- สคริปต์ทำความสะอาดฐานข้อมูลก่อนสร้างใหม่
-- รันสคริปต์นี้ใน Supabase SQL Editor ก่อนรัน database_schema.sql

-- ลบ Views ก่อน
DROP VIEW IF EXISTS yearly_stats CASCADE;
DROP VIEW IF EXISTS monthly_stats CASCADE;
DROP VIEW IF EXISTS order_details CASCADE;

-- ลบ Functions และ Triggers
DROP TRIGGER IF EXISTS trigger_orders_stats ON orders;
DROP FUNCTION IF EXISTS trigger_update_daily_stats() CASCADE;
DROP FUNCTION IF EXISTS get_sales_by_category(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_top_selling_items(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_daily_stats(DATE) CASCADE;

-- ลบ Triggers อื่นๆ
DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON daily_stats;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;

-- ลบ Function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ลบตารางทั้งหมด (ระวัง: จะลบข้อมูลทั้งหมด)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- แสดงข้อความยืนยัน
SELECT 'Database cleaned successfully. Now run database_schema.sql' as message;
