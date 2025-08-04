import React, { useState } from 'react';

export default function SimpleTest() {
  const [result, setResult] = useState('ยังไม่ทดสอบ');

  const testDirect = async () => {
    try {
      setResult('กำลังทดสอบ...');
      
      const response = await fetch('https://ectkqadvatwrodmqkuze.supabase.co/rest/v1/menu_items?select=*&limit=5', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdGtxYWR2YXR3cm9kbXFrdXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTI1MDMsImV4cCI6MjA2OTEyODUwM30.vpKbaq98KYcMU_1s_co3oLLcjRvL010KYOrvf2JnpoE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdGtxYWR2YXR3cm9kbXFrdXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTI1MDMsImV4cCI6MjA2OTEyODUwM30.vpKbaq98KYcMU_1s_co3oLLcjRvL010KYOrvf2JnpoE',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ สำเร็จ! พบข้อมูล ${data.length} รายการ: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ HTTP Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>🧪 ทดสอบ Supabase โดยตรง</h1>
      <button onClick={testDirect} style={{ padding: '10px 20px', fontSize: '16px' }}>
        ทดสอบการเชื่อมต่อ
      </button>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', whiteSpace: 'pre-wrap' }}>
        {result}
      </div>
    </div>
  );
}
