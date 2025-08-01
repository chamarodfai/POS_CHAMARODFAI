-- สคริปต์ตรวจสอบโครงสร้างฐานข้อมูล
-- รันใน Supabase SQL Editor เพื่อตรวจสอบว่าตารางสร้างถูกต้อง

-- ตรวจสอบตารางที่มีอยู่
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'menu_items', 'promotions', 'orders', 'order_items', 'daily_stats')
ORDER BY table_name;

-- ตรวจสอบคอลัมน์ในตาราง daily_stats
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'daily_stats'
ORDER BY ordinal_position;

-- ตรวจสอบ Views ที่มีอยู่
SELECT 
  table_name as view_name,
  view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name IN ('order_details', 'monthly_stats', 'yearly_stats');

-- ตรวจสอบ Functions ที่มีอยู่
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('update_daily_stats', 'get_top_selling_items', 'get_sales_by_category');

-- ทดสอบ View yearly_stats
SELECT 'Testing yearly_stats view...' as test;
SELECT * FROM yearly_stats LIMIT 1;
