import React, { useState, useEffect } from 'react';
import { useSimpleApp } from '../context/SimpleAppContext2';
import supabase from '../config/supabase';

function DataComparisonTest() {
  const { state } = useSimpleApp();
  const [databaseData, setDatabaseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const loadDatabaseData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDatabaseData(data || []);
      console.log('🔍 Direct database data:', data);
      
    } catch (err) {
      console.error('❌ Failed to load database data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const webappData = state?.menuItems || [];

  const compareFields = (dbItem, webappItem) => {
    const fieldsToCheck = ['id', 'name', 'price', 'category', 'description', 'available'];
    const differences = [];
    
    for (const field of fieldsToCheck) {
      if (dbItem[field] !== webappItem[field]) {
        differences.push({
          field,
          database: dbItem[field],
          webapp: webappItem[field]
        });
      }
    }
    
    return differences;
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>📊 เปรียบเทียบข้อมูลระหว่าง Database และ WebApp</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* ข้อมูลจาก Database */}
        <div>
          <h2 style={{ color: '#2563eb' }}>🗄️ ข้อมูลจาก Database ({databaseData.length} รายการ)</h2>
          {error ? (
            <div style={{ color: 'red', background: '#fee2e2', padding: '10px', borderRadius: '4px' }}>
              Error: {error}
            </div>
          ) : (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', maxHeight: '400px', overflow: 'auto' }}>
              {databaseData.length === 0 ? (
                <p>ไม่พบข้อมูลจาก Database</p>
              ) : (
                databaseData.map(item => (
                  <div key={`db-${item.id}`} style={{ 
                    background: 'white', 
                    margin: '5px 0', 
                    padding: '10px', 
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <strong>ID:</strong> {item.id}<br/>
                    <strong>Name:</strong> {item.name}<br/>
                    <strong>Price:</strong> ฿{item.price}<br/>
                    <strong>Category:</strong> {item.category}<br/>
                    <strong>Description:</strong> {item.description}<br/>
                    <strong>Available:</strong> {item.available ? 'Yes' : 'No'}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ข้อมูลจาก WebApp */}
        <div>
          <h2 style={{ color: '#059669' }}>🌐 ข้อมูลจาก WebApp ({webappData.length} รายการ)</h2>
          <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '4px', maxHeight: '400px', overflow: 'auto' }}>
            {webappData.length === 0 ? (
              <p>ไม่พบข้อมูลจาก WebApp Context</p>
            ) : (
              webappData.map(item => (
                <div key={`webapp-${item.id}`} style={{ 
                  background: 'white', 
                  margin: '5px 0', 
                  padding: '10px', 
                  borderRadius: '4px',
                  border: '1px solid #d1fae5'
                }}>
                  <strong>ID:</strong> {item.id}<br/>
                  <strong>Name:</strong> {item.name}<br/>
                  <strong>Price:</strong> ฿{item.price}<br/>
                  <strong>Category:</strong> {item.category}<br/>
                  <strong>Description:</strong> {item.description}<br/>
                  <strong>Available:</strong> {item.available ? 'Yes' : 'No'}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* การเปรียบเทียบ */}
      <div>
        <h2 style={{ color: '#dc2626' }}>🔍 การเปรียบเทียบข้อมูล</h2>
        
        <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          <h3>สถิติ:</h3>
          <p>📊 จำนวนรายการใน Database: <strong>{databaseData.length}</strong></p>
          <p>🌐 จำนวนรายการใน WebApp: <strong>{webappData.length}</strong></p>
          <p>⚖️ ความแตกต่าง: <strong>{Math.abs(databaseData.length - webappData.length)}</strong> รายการ</p>
        </div>

        {databaseData.length === 0 && webappData.length === 0 ? (
          <p>ไม่มีข้อมูลทั้งสองฝั่ง</p>
        ) : databaseData.length === 0 ? (
          <p style={{ color: 'red' }}>⚠️ Database ไม่มีข้อมูล แต่ WebApp มี {webappData.length} รายการ (อาจใช้ Mock Data)</p>
        ) : webappData.length === 0 ? (
          <p style={{ color: 'red' }}>⚠️ WebApp ไม่มีข้อมูล แต่ Database มี {databaseData.length} รายการ</p>
        ) : (
          <div>
            <h3>การเปรียบเทียบรายการ:</h3>
            {databaseData.map(dbItem => {
              const webappItem = webappData.find(item => item.id === dbItem.id);
              
              if (!webappItem) {
                return (
                  <div key={`missing-${dbItem.id}`} style={{ 
                    background: '#fee2e2', 
                    padding: '10px', 
                    margin: '5px 0', 
                    borderRadius: '4px',
                    border: '1px solid #fecaca'
                  }}>
                    <strong>❌ หายไปจาก WebApp:</strong> {dbItem.name} (ID: {dbItem.id})
                  </div>
                );
              }
              
              const differences = compareFields(dbItem, webappItem);
              
              if (differences.length === 0) {
                return (
                  <div key={`match-${dbItem.id}`} style={{ 
                    background: '#d1fae5', 
                    padding: '10px', 
                    margin: '5px 0', 
                    borderRadius: '4px',
                    border: '1px solid #a7f3d0'
                  }}>
                    <strong>✅ ตรงกัน:</strong> {dbItem.name} (ID: {dbItem.id})
                  </div>
                );
              }
              
              return (
                <div key={`diff-${dbItem.id}`} style={{ 
                  background: '#fef3c7', 
                  padding: '10px', 
                  margin: '5px 0', 
                  borderRadius: '4px',
                  border: '1px solid #fde68a'
                }}>
                  <strong>⚠️ แตกต่าง:</strong> {dbItem.name} (ID: {dbItem.id})
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {differences.map(diff => (
                      <li key={diff.field}>
                        <strong>{diff.field}:</strong> Database = "{diff.database}" | WebApp = "{diff.webapp}"
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            
            {/* รายการที่มีใน WebApp แต่ไม่มีใน Database */}
            {webappData.filter(webappItem => !databaseData.find(dbItem => dbItem.id === webappItem.id)).map(extraItem => (
              <div key={`extra-${extraItem.id}`} style={{ 
                background: '#ddd6fe', 
                padding: '10px', 
                margin: '5px 0', 
                borderRadius: '4px',
                border: '1px solid #c4b5fd'
              }}>
                <strong>🆕 มีเฉพาะใน WebApp:</strong> {extraItem.name} (ID: {extraItem.id})
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <button 
          onClick={loadDatabaseData}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 รีเฟรชข้อมูล
        </button>
      </div>

      {/* Debug Information */}
      <details style={{ marginTop: '30px' }}>
        <summary style={{ cursor: 'pointer', padding: '10px', background: '#f3f4f6', borderRadius: '4px' }}>
          🐛 Debug Information
        </summary>
        <div style={{ padding: '10px' }}>
          <h4>Database Raw Data:</h4>
          <pre style={{ background: '#f8fafc', padding: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(databaseData, null, 2)}
          </pre>
          
          <h4>WebApp Raw Data:</h4>
          <pre style={{ background: '#f0fdf4', padding: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(webappData, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}

export default DataComparisonTest;
