-- ======================================
-- ULTRA-SAFE DATABASE RESET SCRIPT
-- รันสคริปต์นี้เพื่อลบและสร้างฐานข้อมูลใหม่
-- ======================================

-- Step 1: ลบ Views ก่อน (ไม่ขึ้นกับตาราง)
DROP VIEW IF EXISTS yearly_stats CASCADE;
DROP VIEW IF EXISTS monthly_stats CASCADE;
DROP VIEW IF EXISTS order_details CASCADE;

-- Step 2: ลบ Functions ทั้งหมดก่อน (ไม่ขึ้นกับตาราง)
DROP FUNCTION IF EXISTS trigger_update_daily_stats() CASCADE;
DROP FUNCTION IF EXISTS get_sales_by_category(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_top_selling_items(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_daily_stats(DATE) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 3: ลบตารางทั้งหมด (Triggers จะหายไปอัตโนมัติ)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Step 4: ลบ Extensions หรือ Types ที่อาจเหลืออยู่ (ถ้ามี)
-- (ปกติไม่จำเป็น แต่เผื่อ)

-- แสดงข้อความยืนยัน
SELECT 'Database reset completed successfully. Ready for new schema.' as status;
