// src/components/SupabaseStatus.js
import React, { useState, useEffect } from 'react';
import supabase from '../config/supabase';

const SupabaseStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [healthStatus, setHealthStatus] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('menu_items')
        .select('count')
        .limit(1);
      
      if (error) {
        setConnectionStatus('failed');
        console.error('Connection failed:', error.message);
      } else {
        setConnectionStatus('connected');
        setHealthStatus({ success: true, message: 'Database is healthy' });
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Connection error:', error);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4ade80';
      case 'failed': return '#f87171';
      case 'error': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '✅ เชื่อมต่อ Supabase สำเร็จ';
      case 'failed': return '❌ ไม่สามารถเชื่อมต่อ Supabase';
      case 'error': return '⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ';
      default: return '🔄 กำลังตรวจสอบการเชื่อมต่อ...';
    }
  };

  // Don't show in production unless there's an error
  if (process.env.NODE_ENV === 'production' && connectionStatus === 'connected') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      backgroundColor: 'white',
      border: `2px solid ${getStatusColor()}`,
      borderRadius: '8px',
      padding: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      maxWidth: '300px',
      fontSize: '14px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: showDetails ? '10px' : '0'
      }}>
        <span style={{ fontWeight: 'bold' }}>
          {getStatusText()}
        </span>
        {healthStatus && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#666'
            }}
          >
            {showDetails ? '▼' : '▶'}
          </button>
        )}
      </div>

      {showDetails && healthStatus && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
            Database Status:
          </div>
          {Object.entries(healthStatus.tables || {}).map(([table, status]) => (
            <div key={table} style={{ marginBottom: '2px' }}>
              <span style={{ 
                color: status.status === 'ok' ? '#4ade80' : '#f87171',
                marginRight: '5px'
              }}>
                {status.status === 'ok' ? '✅' : '❌'}
              </span>
              <span style={{ fontFamily: 'monospace' }}>{table}</span>
              {status.count !== undefined && (
                <span style={{ color: '#888', marginLeft: '5px' }}>
                  ({status.count} records)
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {connectionStatus !== 'connected' && (
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={checkConnection}
            style={{
              backgroundColor: getStatusColor(),
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ลองใหม่
          </button>
        </div>
      )}
    </div>
  );
};

export default SupabaseStatus;
