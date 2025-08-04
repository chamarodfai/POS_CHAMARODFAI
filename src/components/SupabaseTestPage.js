import React, { useState, useEffect } from 'react';
import supabase from '../config/supabase';

export default function SupabaseTestPage() {
  const [status, setStatus] = useState('🔄 กำลังทดสอบ...');
  const [details, setDetails] = useState('');
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('🔄 กำลังทดสอบการเชื่อมต่อ Supabase...');
      
      // ทดสอบการเชื่อมต่อ
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .limit(5);

      if (error) {
        setStatus('❌ เชื่อมต่อไม่สำเร็จ');
        setDetails(`Error: ${error.message}`);
      } else {
        setStatus('✅ เชื่อมต่อ Supabase สำเร็จ!');
        setDetails(`พบข้อมูล ${data ? data.length : 0} รายการ`);
        setMenuItems(data || []);
      }
    } catch (err) {
      setStatus('❌ เกิดข้อผิดพลาด');
      setDetails(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 ทดสอบ Supabase Connection</h1>
      
      <div style={{ 
        padding: '20px', 
        margin: '20px 0', 
        backgroundColor: '#f0f8ff', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h2>{status}</h2>
        {details && <p>{details}</p>}
        
        <button 
          onClick={testConnection}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          🔄 ทดสอบใหม่
        </button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>URL:</strong> {process.env.REACT_APP_SUPABASE_URL || 'ไม่พบ'}</p>
        <p><strong>API Key:</strong> {process.env.REACT_APP_SUPABASE_ANON_KEY ? 'มี' : 'ไม่มี'}</p>
      </div>

      {menuItems.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>🍽️ ตัวอย่างข้อมูลเมนู:</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {menuItems.map((item, index) => (
              <div key={index} style={{ 
                padding: '10px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                <strong>{item.name}</strong> - ฿{item.price} 
                <br />
                <small style={{ color: '#666' }}>{item.description}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
        <h4>📋 ขั้นตอนต่อไป:</h4>
        <ol>
          <li>ถ้าเชื่อมต่อสำเร็จ ไปที่ <a href="/order">หน้าสั่งอาหาร</a></li>
          <li>จัดการเมนู ไปที่ <a href="/menu">จัดการเมนู</a></li>
          <li>ดูรายงาน ไปที่ <a href="/dashboard">Dashboard</a></li>
        </ol>
      </div>
    </div>
  );
}
