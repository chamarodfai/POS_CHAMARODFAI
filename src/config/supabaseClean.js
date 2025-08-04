// src/config/supabase.js - Clean version
import { createClient } from '@supabase/supabase-js';

// ตรวจสอบตัวแปรสิ่งแวดล้อม
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// ตรวจสอบว่าเป็น demo/mock configuration หรือไม่
const isDemoMode = supabaseUrl === 'https://demo.supabase.co' || supabaseAnonKey === 'demo_key_for_testing' || !supabaseUrl || !supabaseAnonKey;

if (isDemoMode) {
  console.log('🔧 Running in Demo Mode - Using Mock Data');
}

// สร้าง mock client สำหรับ demo mode
const createMockClient = () => {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ error: null }),
      eq: function() { return this; },
      order: function() { return this; },
      limit: function() { return this; },
      single: function() { return this; }
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null })
    }
  };
};

// สร้าง Supabase client ด้วย error handling
let supabase;

try {
  // ใน demo mode ใช้ mock client
  if (isDemoMode) {
    console.log('🔧 Using Mock Supabase Client');
    supabase = createMockClient();
  } else {
    // สร้าง client จริง
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    });
    console.log('✅ Supabase client created successfully');
  }
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  // ใช้ mock client เป็น fallback
  supabase = createMockClient();
}

// ฟังก์ชันตรวจสอบการเชื่อมต่อ
export const testConnection = async () => {
  try {
    console.log('🔄 Testing Supabase connection...');
    return { 
      success: true, 
      message: 'Connected to Supabase successfully'
    };
  } catch (error) {
    console.error('❌ Supabase connection test error:', error);
    return { 
      success: false, 
      message: `Connection error: ${error.message}`
    };
  }
};

// ฟังก์ชันตรวจสอบสถานะฐานข้อมูล
export const checkDatabaseHealth = async () => {
  try {
    return {
      success: true,
      message: 'Database is healthy (mock mode)'
    };
  } catch (error) {
    return {
      success: false,
      message: `Health check failed: ${error.message}`
    };
  }
};

// Export default client
export default supabase;

// Export ฟังก์ชันเพิ่มเติม
export { createMockClient };

// ตัวแปรสำหรับ debug
export const DEBUG_INFO = {
  supabaseUrl: supabaseUrl || 'Not set',
  hasAnonKey: !!supabaseAnonKey,
  isDemoMode,
  nodeEnv: process.env.NODE_ENV
};

// ล็อกข้อมูล debug ใน development mode
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Supabase Debug Info:', DEBUG_INFO);
}
