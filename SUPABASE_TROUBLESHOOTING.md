# Supabase Connection Troubleshooting Guide
# คู่มือแก้ไขปัญหาการเชื่อมต่อ Supabase

## 🔍 การตรวจสอบปัญหาเบื้องต้น

### 1. ตรวจสอบ Environment Variables
```bash
# Local Development
echo $REACT_APP_SUPABASE_URL
echo $REACT_APP_SUPABASE_ANON_KEY

# หรือใน Browser Developer Tools
console.log(process.env.REACT_APP_SUPABASE_URL)
console.log(process.env.REACT_APP_SUPABASE_ANON_KEY)
```

### 2. ตรวจสอบ Supabase Project Status
- ไปที่ https://app.supabase.com
- ตรวจสอบว่าโปรเจคยังคงใช้งานได้
- ตรวจสอบ API Keys ใน Settings > API

### 3. ตรวจสอบ Database Schema
- ตรวจสอบว่าตารางทั้งหมดถูกสร้างแล้ว
- Run SQL script: database_schema_fixed.sql

## ❌ ปัญหาที่พบบ่อยและการแก้ไข

### Problem 1: "Missing Supabase environment variables"
**สาเหตุ:** ไม่ได้ตั้งค่า Environment Variables

**การแก้ไข:**
1. สร้างไฟล์ `.env.local` ใน root directory
2. เพิ่ม:
   ```
   REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Restart development server

### Problem 2: "Network request failed"
**สาเหตุ:** URL ไม่ถูกต้อง หรือ internet connection

**การแก้ไข:**
1. ตรวจสอบ REACT_APP_SUPABASE_URL
2. ตรวจสอบ internet connection
3. ลอง curl test:
   ```bash
   curl -H "apikey: YOUR_ANON_KEY" "YOUR_SUPABASE_URL/rest/v1/"
   ```

### Problem 3: "Invalid API key"
**สาเหตุ:** API Key ไม่ถูกต้อง

**การแก้ไข:**
1. ไปที่ Supabase Dashboard > Settings > API
2. คัดลอก "anon" "public" key ใหม่
3. อัปเดต REACT_APP_SUPABASE_ANON_KEY

### Problem 4: "relation 'menu_items' does not exist"
**สาเหตุ:** Database schema ยังไม่ถูกสร้าง

**การแก้ไข:**
1. ไปที่ Supabase Dashboard > SQL Editor
2. Run script จากไฟล์ `database_schema_fixed.sql`
3. ตรวจสอบว่าทุกตารางถูกสร้าง

### Problem 5: Vercel Deployment Issues
**สาเหตุ:** Environment Variables ไม่ได้ตั้งค่าใน Vercel

**การแก้ไข:**
1. ไปที่ Vercel Dashboard > Your Project > Settings > Environment Variables
2. เพิ่ม:
   - REACT_APP_SUPABASE_URL
   - REACT_APP_SUPABASE_ANON_KEY
3. Redeploy

## 🛠️ การทดสอบการเชื่อมต่อ

### Test 1: Basic Connection
```javascript
import { testConnection } from './src/config/supabase';

testConnection().then(result => {
  console.log('Connection test:', result);
});
```

### Test 2: Database Health Check
```javascript
import { checkDatabaseHealth } from './src/config/supabase';

checkDatabaseHealth().then(result => {
  console.log('Database health:', result);
});
```

### Test 3: Manual Query Test
```javascript
import supabase from './src/config/supabase';

supabase
  .from('menu_items')
  .select('*')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('Query failed:', error);
    } else {
      console.log('Query successful:', data);
    }
  });
```

## 🔧 Development vs Production

### Development (.env.local)
```
REACT_APP_SUPABASE_URL=https://your-dev-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-dev-anon-key
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

### Production (Vercel Environment Variables)
```
REACT_APP_SUPABASE_URL=https://your-prod-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-prod-anon-key
REACT_APP_ENVIRONMENT=production
```

## 🆘 Emergency Fixes

### Quick Fix 1: Use Mock Data
ถ้าต้องการให้แอปทำงานได้ทันที โดยไม่ต้องเชื่อมต่อ database:

1. เปิดไฟล์ `src/config/supabase.js`
2. เปลี่ยน `REACT_APP_MOCK_DATA=false` เป็น `true`
3. Restart application

### Quick Fix 2: Reset Database
ถ้า database มีปัญหา:

1. ไปที่ Supabase Dashboard > Settings > Database
2. Reset database (ข้อมูลจะหายหมด!)
3. Run `database_schema_fixed.sql` ใหม่

## 📞 การขอความช่วยเหลือ

ถ้ายังแก้ไขไม่ได้:

1. เปิด Browser Developer Tools (F12)
2. ดู Console และ Network tabs
3. Screenshot error messages
4. ตรวจสอบ Vercel deployment logs
5. ตรวจสอบ Supabase logs ใน Dashboard
