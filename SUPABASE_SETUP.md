# คู่มือการตั้งค่า Supabase สำหรับระบบ POS

## ขั้นตอนที่ 1: สร้างโปรเจค Supabase

1. ไปที่ [https://app.supabase.io](https://app.supabase.io)
2. สร้างบัญชีใหม่หรือเข้าสู่ระบบ
3. คลิก "New Project"
4. กรอกข้อมูล:
   - **Organization**: เลือกหรือสร้างใหม่
   - **Project Name**: `POS-System` (หรือชื่อที่ต้องการ)
   - **Database Password**: รหัสผ่านที่แข็งแรง (เก็บไว้ให้ดี)
   - **Region**: เลือกที่ใกล้ที่สุด (เช่น Southeast Asia - Singapore)
5. คลิก "Create new project"
6. รอให้โปรเจคสร้างเสร็จ (ประมาณ 2-3 นาที)

## ขั้นตอนที่ 2: ตั้งค่าฐานข้อมูล

1. เมื่อโปรเจคสร้างเสร็จแล้ว ไปที่ **SQL Editor** (เมนูด้านซ้าย)
2. คลิก "New query"

### หากเป็นการสร้างครั้งแรก:
3. คัดลอกโค้ด SQL ทั้งหมดจากไฟล์ `database_schema.sql`
4. วางในหน้า SQL Editor
5. คลิก "Run" เพื่อสร้างตารางและฟังก์ชัน

### หากมีข้อมูลเก่าอยู่แล้ว:
3. รันไฟล์ `database_cleanup.sql` ก่อน เพื่อลบข้อมูลเก่า
4. จากนั้นรันไฟล์ `database_schema.sql`

### ตรวจสอบการติดตั้ง:
5. รันไฟล์ `database_check.sql` เพื่อตรวจสอบว่าทุกอย่างถูกต้อง
6. ตรวจสอบว่าไม่มี error

## ขั้นตอนที่ 3: ตั้งค่า API

1. ไปที่ **Settings** > **API** (เมนูด้านซ้าย)
2. คัดลอกข้อมูลต่อไปนี้:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ขั้นตอนที่ 4: ตั้งค่า Environment Variables

1. สร้างไฟล์ `.env.local` ในโฟลเดอร์หลักของโปรเจค
2. เพิ่มข้อมูลต่อไปนี้:

```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ สำคัญ**: แทนที่ค่าข้างต้นด้วยค่าจริงจาก Supabase Dashboard

## ขั้นตอนที่ 5: ทดสอบการเชื่อมต่อ

1. บันทึกไฟล์ `.env.local`
2. รีสตาร์ทเซิร์ฟเวอร์:
   ```bash
   npm start
   ```
3. เปิดเว็บแอปพลิเคชัน
4. ถ้าการเชื่อมต่อสำเร็จ จะไม่มีข้อความแสดงข้อผิดพลาดด้านบน
5. ลองเพิ่มเมนูหรือโปรโมชั่นเพื่อทดสอบ

## ขั้นตอนที่ 6: ตั้งค่าความปลอดภัย (Row Level Security)

เพื่อความปลอดภัย ควรเปิด RLS สำหรับตารางที่สำคัญ:

1. ไปที่ **Authentication** > **Policies**
2. หรือรันคำสั่ง SQL นี้:

```sql
-- เปิด RLS สำหรับทุกตาราง
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy อนุญาตให้ทุกคนเข้าถึงได้ (สำหรับ Demo)
-- ⚠️ ในการใช้งานจริง ควรจำกัดสิทธิ์ให้เหมาะสม
CREATE POLICY "Enable all operations for all users" ON menu_items FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON promotions FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON orders FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON order_items FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON daily_stats FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON categories FOR ALL USING (true);
```

## การแก้ไขปัญหาที่พบบ่อย

### ❌ ไม่สามารถเชื่อมต่อได้
- ตรวจสอบว่า URL และ API Key ถูกต้อง
- ตรวจสอบว่าไฟล์ `.env.local` อยู่ในตำแหน่งที่ถูกต้อง
- รีสตาร์ทเซิร์ฟเวอร์ `npm start`

### ❌ Table doesn't exist
- ตรวจสอบว่าได้รัน SQL ใน database_schema.sql แล้ว
- ลองรันคำสั่ง SQL ทีละส่วน

### ❌ Column "active" does not exist
- รัน `database_cleanup.sql` เพื่อลบตารางเก่า
- รัน `database_schema.sql` ใหม่อีกครั้ง
- ตรวจสอบด้วย `database_check.sql`

### ❌ Permission denied
- ตรวจสอบ RLS policies
- ตรวจสอบว่าใช้ anon key ที่ถูกต้อง

### ❌ Invalid API key
- ตรวจสอบว่าคัดลอก anon key ถูกต้อง (ไม่ใช่ service_role key)
- ตรวจสอบว่าไม่มีช่องว่างหรือการขึ้นบรรทัดใหม่

### ❌ View creation failed
- รัน `database_cleanup.sql` ก่อน
- รัน `database_schema.sql` ใหม่ทั้งหมด
- ตรวจสอบ syntax errors ใน SQL

## ฟีเจอร์เพิ่มเติม

### 📊 Real-time Updates
Supabase รองรับ real-time updates อัตโนมัติ หากต้องการให้ข้อมูลอัปเดตแบบ real-time:

```javascript
// ตัวอย่างการใช้ real-time subscriptions
const subscription = supabase
  .channel('pos-updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order updated:', payload);
      // อัปเดต state
    }
  )
  .subscribe();
```

### 🔐 Authentication
หากต้องการเพิ่มระบบล็อกอิน:

```javascript
// ตัวอย่างการ login
const { user, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### 🖼️ File Upload
หากต้องการอัปโหลดรูปภาพเมนู:

```javascript
// ตัวอย่างการอัปโหลดไฟล์
const { data, error } = await supabase.storage
  .from('menu-images')
  .upload('menu-item-1.jpg', file);
```
