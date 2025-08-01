// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

// ตรวจสอบตัวแปรสิ่งแวดล้อม
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please check your .env file and make sure you have:');
  console.error('REACT_APP_SUPABASE_URL=your_supabase_url');
  console.error('REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key');
}

// สร้าง Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// ฟังก์ชันตรวจสอบการเชื่อมต่อ
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true, message: 'Connected to Supabase successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ฟังก์ชันจัดการข้อผิดพลาด
export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error);
  
  // แปลข้อความข้อผิดพลาดเป็นภาษาไทย
  const errorMessages = {
    'Network request failed': 'การเชื่อมต่อกับเซิร์ฟเวอร์ล้มเหลว',
    'Invalid API key': 'API Key ไม่ถูกต้อง',
    'Missing table': 'ไม่พบตารางข้อมูล',
    'Row not found': 'ไม่พบข้อมูล',
    'Permission denied': 'ไม่มีสิทธิ์เข้าถึงข้อมูล',
    'Duplicate key value': 'ข้อมูลซ้ำ'
  };
  
  for (const [key, value] of Object.entries(errorMessages)) {
    if (error.message.includes(key)) {
      return value;
    }
  }
  
  return error.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
};

// ฟังก์ชันช่วยในการรอข้อมูล
export const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Export default client
export default supabase;
