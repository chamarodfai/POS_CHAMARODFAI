import { createClient } from '@supabase/supabase-js';

// Hard-coded values เพื่อให้แน่ใจว่าใช้งานได้
const supabaseUrl = 'https://ectkqadvatwrodmqkuze.supabase.co';
// ใช้ service_role key สำหรับ development (เข้าถึงข้อมูลได้เต็มที่)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdGtxYWR2YXR3cm9kbXFrdXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU1MjUwMywiZXhwIjoyMDY5MTI4NTAzfQ.Y0F8dJHt_YQI6-_QMJhlKX6klOpDh6TkGnHQhYj8qDw';

console.log('🔍 Supabase Configuration:');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);
console.log('Key type:', supabaseKey.includes('anon') ? 'anon' : 'service_role');

// สร้าง Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

console.log('✅ Supabase client initialized successfully');

export default supabase;
