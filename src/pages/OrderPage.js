import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import './OrderPage.css';

function OrderPage() {
  const { state, dispatch } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [showPromotions, setShowPromotions] = useState(false);

  const categories = ['ทั้งหมด', ...new Set(state.menuItems.map(item => item.category))];
  
  const filteredMenuItems = selectedCategory === 'ทั้งหมด' 
    ? state.menuItems.filter(item => item.available)
    : state.menuItems.filter(item => item.category === selectedCategory && item.available);

  const addToOrder = (item) => {
    dispatch({ type: 'ADD_TO_ORDER', payload: item });
  };

  const removeFromOrder = (itemId) => {
    dispatch({ type: 'REMOVE_FROM_ORDER', payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  };

  const applyPromotion = (promotion) => {
    dispatch({ type: 'APPLY_PROMOTION', payload: promotion });
    setShowPromotions(false);
  };

  const removePromotion = () => {
    dispatch({ type: 'REMOVE_PROMOTION' });
  };

  const completeOrder = () => {
    if (state.currentOrder.items.length === 0) {
      alert('กรุณาเลือกสินค้าก่อนทำการสั่งซื้อ');
      return;
    }
    
    dispatch({ type: 'COMPLETE_ORDER' });
    alert('สั่งซื้อสำเร็จ!');
  };

  const clearOrder = () => {
    dispatch({ type: 'CLEAR_ORDER' });
  };

  return (
    <div className="order-page">
      <div className="order-container">
        <div className="menu-section">
          <div className="menu-header">
            <h2>เมนูอาหาร</h2>
            <div className="category-filter">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className="menu-grid">
            {filteredMenuItems.map(item => (
              <div key={item.id} className="menu-item">
                <div className="menu-item-info">
                  <h3>{item.name}</h3>
                  <p className="description">{item.description}</p>
                  <p className="price">฿{item.price}</p>
                </div>
                <button 
                  className="add-btn"
                  onClick={() => addToOrder(item)}
                >
                  เพิ่ม
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="order-section">
          <div className="order-header">
            <h2>รายการสั่งซื้อ</h2>
            {state.currentOrder.items.length > 0 && (
              <button className="clear-btn" onClick={clearOrder}>
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <div className="order-items">
            {state.currentOrder.items.length === 0 ? (
              <p className="empty-order">ยังไม่มีรายการสั่งซื้อ</p>
            ) : (
              state.currentOrder.items.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>฿{item.price}</p>
                  </div>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="item-total">
                    ฿{item.price * item.quantity}
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromOrder(item.id)}
                  >
                    ลบ
                  </button>
                </div>
              ))
            )}
          </div>

          {state.currentOrder.items.length > 0 && (
            <div className="order-summary">
              <div className="promotion-section">
                <button 
                  className="promotion-btn"
                  onClick={() => setShowPromotions(!showPromotions)}
                >
                  {state.currentOrder.appliedPromotion ? 'เปลี่ยนโปรโมชั่น' : 'ใช้โปรโมชั่น'}
                </button>
                
                {state.currentOrder.appliedPromotion && (
                  <div className="applied-promotion">
                    <span>ใช้: {state.currentOrder.appliedPromotion.name}</span>
                    <button onClick={removePromotion}>ยกเลิก</button>
                  </div>
                )}

                {showPromotions && (
                  <div className="promotions-list">
                    {state.promotions
                      .filter(promo => promo.active)
                      .map(promotion => (
                        <div key={promotion.id} className="promotion-item">
                          <div>
                            <h4>{promotion.name}</h4>
                            <p>{promotion.description}</p>
                            {promotion.minAmount && (
                              <p className="min-amount">
                                ขั้นต่ำ ฿{promotion.minAmount}
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={() => applyPromotion(promotion)}
                            disabled={promotion.minAmount && state.currentOrder.subtotal < promotion.minAmount}
                          >
                            ใช้
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span>ยอดรวม:</span>
                  <span>฿{state.currentOrder.subtotal}</span>
                </div>
                {state.currentOrder.discount > 0 && (
                  <div className="summary-row discount">
                    <span>ส่วนลด:</span>
                    <span>-฿{state.currentOrder.discount}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>ยอดสุทธิ:</span>
                  <span>฿{state.currentOrder.total}</span>
                </div>
              </div>

              <button className="complete-btn" onClick={completeOrder}>
                ยืนยันการสั่งซื้อ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderPage;
