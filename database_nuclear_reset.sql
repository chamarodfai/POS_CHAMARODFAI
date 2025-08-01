-- =======================================
-- NUCLEAR OPTION - ลบทุกอย่างเริ่มใหม่
-- ⚠️ ระวัง: จะลบข้อมูลทั้งหมดในฐานข้อมูล
-- =======================================

-- วิธีการใช้:
-- 1. รันสคริปต์นี้ใน Supabase SQL Editor
-- 2. รัน database_schema_fixed.sql
-- 3. ตั้งค่า .env.local
-- 4. ทดสอบแอป

-- ลบ Schema ทั้งหมดและสร้างใหม่
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- กำหนดสิทธิ์ใหม่
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- เปิดใช้งาน Extensions ที่จำเป็น
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- แสดงข้อความยืนยัน
SELECT 'Nuclear reset completed! Database is completely clean.' as status;
SELECT 'Now run database_schema_fixed.sql to recreate everything.' as next_step;
