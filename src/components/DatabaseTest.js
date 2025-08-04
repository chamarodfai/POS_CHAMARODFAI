import React, { useState, useEffect } from 'react';
import supabase from '../config/supabase';

function DatabaseTest() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Testing database connection...');
      console.log('Supabase client:', supabase);
      
      // ทดสอบการเชื่อมต่อ
      const { data, error, count } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact' });
      
      console.log('Database response:', { data, error, count });
      
      if (error) {
        throw error;
      }
      
      setMenuItems(data || []);
      setConnectionStatus('connected');
      console.log('✅ Database connection successful');
      console.log('Menu items loaded:', data?.length || 0);
      
    } catch (err) {
      console.error('❌ Database connection failed:', err);
      setError(err.message);
      setConnectionStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const insertTestItem = async () => {
    try {
      const testItem = {
        name: 'Test Item ' + Date.now(),
        price: 99,
        category: 'ทดสอบ',
        description: 'รายการทดสอบการเพิ่มข้อมูล',
        available: true
      };
      
      console.log('Adding test item:', testItem);
      
      const { data, error } = await supabase
        .from('menu_items')
        .insert([testItem])
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Test item added:', data);
      alert('เพิ่มรายการทดสอบสำเร็จ!');
      
      // รีโหลดข้อมูล
      testDatabaseConnection();
      
    } catch (err) {
      console.error('❌ Failed to add test item:', err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Database Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Connection Status: 
          <span style={{ 
            color: connectionStatus === 'connected' ? 'green' : 
                   connectionStatus === 'failed' ? 'red' : 'orange' 
          }}>
            {connectionStatus}
          </span>
        </h3>
      </div>

      {loading && <p>Loading...</p>}
      
      {error && (
        <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testDatabaseConnection} style={{ marginRight: '10px' }}>
          Refresh Data
        </button>
        <button onClick={insertTestItem}>
          Add Test Item
        </button>
      </div>

      <h3>Menu Items from Database ({menuItems.length} items):</h3>
      
      {menuItems.length === 0 ? (
        <p>No menu items found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Price</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Category</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Description</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Available</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map(item => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>฿{item.price}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.category}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.description}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {item.available ? '✅' : '❌'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Raw Data (JSON):</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(menuItems, null, 2)}
      </pre>
    </div>
  );
}

export default DatabaseTest;
