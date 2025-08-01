-- =======================================
-- DATABASE STATUS CHECK
-- ตรวจสอบสถานะฐานข้อมูลก่อนการติดตั้ง
-- =======================================

-- 1. ตรวจสอบตารางที่มีอยู่
SELECT 'EXISTING TABLES:' as section;
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. ตรวจสอบ Views ที่มีอยู่
SELECT 'EXISTING VIEWS:' as section;
SELECT 
  table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. ตรวจสอบ Functions ที่มีอยู่
SELECT 'EXISTING FUNCTIONS:' as section;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 4. ตรวจสอบ Triggers ที่มีอยู่
SELECT 'EXISTING TRIGGERS:' as section;
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 5. ตรวจสอบ Extensions
SELECT 'INSTALLED EXTENSIONS:' as section;
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension
ORDER BY extname;

-- 6. สรุปสถานะ
SELECT 'DATABASE STATUS SUMMARY:' as section;
SELECT 
  'Tables' as type,
  count(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
  'Views' as type,
  count(*) as count
FROM information_schema.views 
WHERE table_schema = 'public'
UNION ALL
SELECT 
  'Functions' as type,
  count(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';

-- 7. แนะนำขั้นตอนต่อไป
SELECT 
  CASE 
    WHEN (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') = 0 
    THEN 'Database is clean. Run database_schema_fixed.sql'
    ELSE 'Database has existing objects. Consider running database_reset.sql first'
  END as recommendation;
