import React, { useState } from 'react';
import { useSimpleApp } from '../context/SimpleAppContext2';
import './SimpleOrderPage.css';

const SimpleOrderPage = () => {
  const { menuItems, loading } = useSimpleApp();
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [currentOrder, setCurrentOrder] = useState({ items: [], total: 0 });

  // ข้อมูลพื้นฐาน
  const safeMenuItems = menuItems || [];

  // ถ้ายังโหลดอยู่
  if (loading) {
    return <div className="loading">กำลังโหลดข้อมูล...</div>;
  }

  // หมวดหมู่
  const categories = ['ทั้งหมด', ...new Set(safeMenuItems.map(item => item.category))].filter(Boolean);
  
  // กรองเมนู
  const filteredItems = safeMenuItems.filter(item => 
    item.available && (selectedCategory === 'ทั้งหมด' || item.category === selectedCategory)
  );

  // ฟังก์ชันจัดการออเดอร์
  const addToOrder = (item) => {
    const existingItem = currentOrder.items.find(orderItem => orderItem.id === item.id);
    
    if (existingItem) {
      updateQuantity(item.id, existingItem.quantity + 1);
    } else {
      const newOrderItem = {
        ...item,
        quantity: 1,
        subtotal: item.price
      };
      
      setCurrentOrder(prev => ({
        items: [...prev.items, newOrderItem],
        total: prev.total + item.price
      }));
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromOrder(itemId);
      return;
    }

    setCurrentOrder(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            subtotal: item.price * newQuantity
          };
        }
        return item;
      });

      const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        items: updatedItems,
        total: newTotal
      };
    });
  };

  const removeFromOrder = (itemId) => {
    setCurrentOrder(prev => {
      const updatedItems = prev.items.filter(item => item.id !== itemId);
      const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        items: updatedItems,
        total: newTotal
      };
    });
  };

  return (
    <div className="order-page">
      <div className="order-container">
        {/* เมนูอาหาร */}
        <div className="menu-section">
          <h2>เมนูอาหาร</h2>
          
          {/* หมวดหมู่ */}
          <div className="category-filter">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'active' : ''}
              >
                {category}
              </button>
            ))}
          </div>

          {/* รายการเมนู */}
          <div className="menu-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="menu-item">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="price">฿{item.price}</div>
                <button onClick={() => addToOrder(item)}>เพิ่ม</button>
              </div>
            ))}
          </div>
        </div>

        {/* ตะกร้าสินค้า */}
        <div className="order-section">
          <h2>รายการสั่งซื้อ</h2>
          
          {currentOrder.items.length === 0 ? (
            <p>ยังไม่มีรายการสั่งซื้อ</p>
          ) : (
            <>
              {currentOrder.items.map(item => (
                <div key={item.id} className="order-item">
                  <span>{item.name}</span>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <span>฿{item.price * item.quantity}</span>
                  <button onClick={() => removeFromOrder(item.id)}>ลบ</button>
                </div>
              ))}
              <div className="order-total">
                <strong>ยอดรวม: ฿{currentOrder.total}</strong>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleOrderPage;
