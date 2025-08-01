import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import './MenuManagement.css';

function MenuManagement() {
  const { state, dispatch } = useApp();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: '',
    available: true
  });

  const categories = [...new Set(state.menuItems.map(item => item.category))];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const itemData = {
      ...formData,
      price: parseFloat(formData.price)
    };

    if (editingItem) {
      dispatch({ 
        type: 'UPDATE_MENU_ITEM', 
        payload: { ...itemData, id: editingItem.id }
      });
      setEditingItem(null);
    } else {
      dispatch({ type: 'ADD_MENU_ITEM', payload: itemData });
      setIsAddingItem(false);
    }

    setFormData({
      name: '',
      price: '',
      category: '',
      description: '',
      image: '',
      available: true
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description,
      image: item.image,
      available: item.available
    });
    setIsAddingItem(true);
  };

  const handleDelete = (itemId) => {
    if (window.confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
      dispatch({ type: 'DELETE_MENU_ITEM', payload: itemId });
    }
  };

  const handleCancel = () => {
    setIsAddingItem(false);
    setEditingItem(null);
    setFormData({
      name: '',
      price: '',
      category: '',
      description: '',
      image: '',
      available: true
    });
  };

  const toggleAvailability = (item) => {
    dispatch({ 
      type: 'UPDATE_MENU_ITEM', 
      payload: { ...item, available: !item.available }
    });
  };

  return (
    <div className="menu-management">
      <div className="management-header">
        <h1>จัดการเมนูอาหาร</h1>
        <button 
          className="add-item-btn"
          onClick={() => setIsAddingItem(true)}
        >
          + เพิ่มเมนูใหม่
        </button>
      </div>

      {isAddingItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>
              <button className="close-btn" onClick={handleCancel}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="menu-form">
              <div className="form-group">
                <label>ชื่อเมนู *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="กรอกชื่อเมนู"
                  required
                />
              </div>

              <div className="form-group">
                <label>ราคา (บาท) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>หมวดหมู่ *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="กรอกหมวดหมู่ใหม่หรือเลือกจากที่มี"
                  list="categories"
                  required
                />
                <datalist id="categories">
                  {categories.map(category => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label>รายละเอียด</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="รายละเอียดของเมนู"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>URL รูปภาพ</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="available"
                    checked={formData.available}
                    onChange={handleInputChange}
                  />
                  พร้อมจำหน่าย
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  ยกเลิก
                </button>
                <button type="submit" className="save-btn">
                  {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="menu-stats">
        <div className="stat-card">
          <h3>เมนูทั้งหมด</h3>
          <p>{state.menuItems.length}</p>
        </div>
        <div className="stat-card">
          <h3>พร้อมจำหน่าย</h3>
          <p>{state.menuItems.filter(item => item.available).length}</p>
        </div>
        <div className="stat-card">
          <h3>หมวดหมู่</h3>
          <p>{categories.length}</p>
        </div>
      </div>

      <div className="menu-list">
        {categories.map(category => (
          <div key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            <div className="menu-items">
              {state.menuItems
                .filter(item => item.category === category)
                .map(item => (
                  <div key={item.id} className={`menu-item-card ${!item.available ? 'unavailable' : ''}`}>
                    <div className="item-info">
                      <div className="item-header">
                        <h3>{item.name}</h3>
                        <div className="item-status">
                          <span className={`status-badge ${item.available ? 'available' : 'unavailable'}`}>
                            {item.available ? 'พร้อมจำหน่าย' : 'ไม่พร้อมจำหน่าย'}
                          </span>
                        </div>
                      </div>
                      <p className="item-description">{item.description}</p>
                      <div className="item-price">฿{item.price}</div>
                    </div>
                    
                    <div className="item-actions">
                      <button 
                        className={`toggle-btn ${item.available ? 'disable' : 'enable'}`}
                        onClick={() => toggleAvailability(item)}
                      >
                        {item.available ? 'ปิดการขาย' : 'เปิดการขาย'}
                      </button>
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(item)}
                      >
                        แก้ไข
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(item.id)}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {state.menuItems.length === 0 && (
        <div className="empty-state">
          <h3>ยังไม่มีเมนูอาหาร</h3>
          <p>เริ่มต้นด้วยการเพิ่มเมนูแรกของคุณ</p>
          <button 
            className="add-first-btn"
            onClick={() => setIsAddingItem(true)}
          >
            เพิ่มเมนูแรก
          </button>
        </div>
      )}
    </div>
  );
}

export default MenuManagement;
