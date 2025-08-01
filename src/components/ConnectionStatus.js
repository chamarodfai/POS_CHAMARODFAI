import React from 'react';
import { useApp } from '../context/SupabaseAppContext';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
  const { state } = useApp();
  const { supabaseConnected, loading, errors } = state;
  
  // ไม่แสดงอะไรถ้าเชื่อมต่อได้ปกติ
  if (supabaseConnected && !Object.values(loading).some(Boolean) && !Object.values(errors).some(Boolean)) {
    return null;
  }
  
  return (
    <div className="connection-status">
      {!supabaseConnected && (
        <div className="status-item status-error">
          <span className="status-icon">⚠️</span>
          <span>ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้</span>
          <div className="status-details">
            กรุณาตรวจสอบการตั้งค่า Supabase ในไฟล์ .env
          </div>
        </div>
      )}
      
      {supabaseConnected && Object.values(loading).some(Boolean) && (
        <div className="status-item status-loading">
          <span className="status-icon">⏳</span>
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      )}
      
      {Object.entries(errors).map(([type, error]) => error && (
        <div key={type} className="status-item status-error">
          <span className="status-icon">❌</span>
          <span>ข้อผิดพลาด: {error}</span>
        </div>
      ))}
    </div>
  );
};

export default ConnectionStatus;
