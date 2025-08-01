// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

// ตรวจสอบตัวแปรสิ่งแวดล้อม
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// ตรวจสอบการมีอยู่ของตัวแปรสิ่งแวดล้อม
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('📝 Please set up your environment variables:');
  console.error('   REACT_APP_SUPABASE_URL=your_supabase_url');
  console.error('   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error('🔗 Get these values from: https://app.supabase.com > Your Project > Settings > API');
  
  // ใน production ให้แสดง error ที่เป็นมิตรกับผู้ใช้
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Supabase configuration is missing. Please contact the administrator.');
  }
}

// ตรวจสอบรูปแบบ URL
if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
  console.warn('⚠️ Supabase URL format might be incorrect. Expected format: https://your-project-ref.supabase.co');
}

// สร้าง Supabase client ด้วย error handling
let supabase;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    db: {
      schema: process.env.REACT_APP_DB_SCHEMA || 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'pos-system@1.0.0'
      }
    }
  });
  
  console.log('✅ Supabase client created successfully');
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  
  // สร้าง mock client สำหรับ development
  if (process.env.NODE_ENV === 'development') {
    console.warn('🔧 Using mock Supabase client for development');
    supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null })
      })
    };
  } else {
    throw error;
  }
}

// ฟังก์ชันตรวจสอบการเชื่อมต่อ
export const testConnection = async () => {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // ตรวจสอบการเชื่อมต่อด้วยการ query ข้อมูลเบื้องต้น
    const { data, error } = await supabase
      .from('menu_items')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return { 
        success: false, 
        message: `Connection failed: ${error.message}`,
        details: error
      };
    }
    
    console.log('✅ Supabase connection test successful');
    return { 
      success: true, 
      message: 'Connected to Supabase successfully',
      count: data || 0
    };
  } catch (error) {
    console.error('❌ Supabase connection test error:', error);
    return { 
      success: false, 
      message: `Connection error: ${error.message}`,
      details: error
    };
  }
};

// ฟังก์ชันตรวจสอบสถานะฐานข้อมูล
export const checkDatabaseHealth = async () => {
  try {
    const tables = ['categories', 'menu_items', 'promotions', 'orders', 'order_items', 'daily_stats'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        results[table] = error ? 
          { status: 'error', message: error.message } :
          { status: 'ok', count: count || 0 };
      } catch (err) {
        results[table] = { status: 'error', message: err.message };
      }
    }
    
    return { success: true, tables: results };
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
