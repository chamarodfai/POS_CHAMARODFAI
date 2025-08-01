# Vercel Environment Variables Setup
# คู่มือการตั้งค่า Environment Variables ใน Vercel

## ขั้นตอนการตั้งค่า Vercel Environment Variables

### 1. เข้าไปที่ Vercel Dashboard
- ไปที่ https://vercel.com/dashboard
- เลือกโปรเจค POS_CHAMARODFAI

### 2. ตั้งค่า Environment Variables
- ไปที่ Settings > Environment Variables
- เพิ่มตัวแปรดังต่อไปนี้:

```
Name: REACT_APP_SUPABASE_URL
Value: https://your-project-ref.supabase.co
Environment: Production, Preview, Development

Name: REACT_APP_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development

Name: REACT_APP_APP_NAME
Value: POS System
Environment: Production, Preview, Development

Name: REACT_APP_VERSION
Value: 1.0.0
Environment: Production, Preview, Development

Name: REACT_APP_ENVIRONMENT
Value: production
Environment: Production
```

### 3. หาค่า Supabase Credentials
- ไปที่ https://app.supabase.com
- เลือกโปรเจคของคุณ
- ไปที่ Settings > API
- คัดลอก:
  - Project URL → REACT_APP_SUPABASE_URL
  - Project API Key (anon, public) → REACT_APP_SUPABASE_ANON_KEY

### 4. Redeploy
หลังจากตั้งค่าแล้ว:
- ไปที่ Deployments
- กด "Redeploy" บน deployment ล่าสุด
- หรือ push code ใหม่เพื่อให้ deploy อัตโนมัติ

## ตรวจสอบการทำงาน
หลัง deploy สำเร็จ สามารถตรวจสอบได้โดย:
1. เปิดเว็บไซต์
2. เปิด Developer Tools (F12)
3. ดูที่ Console หา message "✅ Supabase client created successfully"

## การแก้ไขปัญหา

### หาก Environment Variables ไม่มีผล
1. ตรวจสอบชื่อตัวแปรว่าขึ้นต้นด้วย `REACT_APP_`
2. Redeploy อีกครั้ง
3. ลอง clear cache ของ Vercel

### หาก Supabase connection ล้มเหลว
1. ตรวจสอบ URL และ API Key
2. ตรวจสอบว่า database schema ถูกสร้างแล้ว
3. ตรวจสอบ RLS (Row Level Security) settings ใน Supabase
