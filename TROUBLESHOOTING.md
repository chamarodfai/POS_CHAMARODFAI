# 🔧 แก้ไขปัญหา Column "active" does not exist

## สาเหตุ
Error นี้เกิดขึ้นเพราะมีตารางหรือ View เก่าอยู่ในฐานข้อมูล ที่มีโครงสร้างไม่ตรงกับ schema ใหม่

## วิธีแก้ไข (ทำตามลำดับ)

### ขั้นตอนที่ 1: ลบข้อมูลเก่า
1. ไปที่ Supabase Dashboard
2. เลือก **SQL Editor**
3. คัดลอกและรันโค้ดจากไฟล์ `database_cleanup.sql`
4. รอจนเสร็จ (ประมาณ 5-10 วินาที)

### ขั้นตอนที่ 2: สร้างฐานข้อมูลใหม่
1. สร้าง Query ใหม่ใน SQL Editor
2. คัดลอกและรันโค้ดทั้งหมดจากไฟล์ `database_schema.sql`
3. รอจนเสร็จ (ประมาณ 10-15 วินาที)

### ขั้นตอนที่ 3: ตรวจสอบ
1. สร้าง Query ใหม่อีกครั้ง
2. รันโค้ดจากไฟล์ `database_check.sql`
3. ตรวจสอบว่าไม่มี error

### ขั้นตอนที่ 4: ทดสอบแอป
1. รีสตาร์ท React app (`npm start`)
2. ตรวจสอบว่าไม่มีข้อความ error ด้านบน
3. ลองเพิ่มเมนูใหม่เพื่อทดสอบ

## หากยังมีปัญหา

### ตรวจสอบเพิ่มเติม:
```sql
-- รันใน SQL Editor เพื่อดูตารางที่มีอยู่
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### ลบทุกอย่างเริ่มใหม่:
```sql
-- ระวัง: จะลบข้อมูลทั้งหมด
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

จากนั้นรัน `database_schema.sql` ใหม่

## สาเหตุที่พบบ่อย
- รัน SQL schema หลายครั้ง โดยไม่ลบของเก่า
- มีการแก้ไข schema แต่ไม่ได้อัปเดตฐานข้อมูล
- Copy-paste SQL ไม่ครบหรือผิดพลาด

## การป้องกัน
- ใช้ `IF NOT EXISTS` ในการสร้างตาราง
- ใช้ `OR REPLACE` ในการสร้าง View และ Function
- ทดสอบใน environment แยกก่อน
