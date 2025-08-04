import React, { useState } from 'react';
import { useSimpleApp } from '../context/SimpleAppContext2';
import './MenuManagement.css';

function MenuManagement() {
  const { menuItems, api } = useSimpleApp();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    category: '',
    description: '',
    image: '',
    available: true
  });

  // Ensure menuItems is always an array
  const safeMenuItems = menuItems || [];
  const categories = [...new Set(safeMenuItems.map(item => item.category))].filter(Boolean);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    
    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
        image_url: formData.image // ✅ แก้ไขให้ตรงกับ database
      };

      if (editingItem) {
        await api.updateMenuItem(editingItem.id, itemData);
        setEditingItem(null);
        alert('แก้ไขเมนูสำเร็จ!');
      } else {
        await api.createMenuItem(itemData);
        setIsAddingItem(false);
        alert('เพิ่มเมนูสำเร็จ!');
      }

      setFormData({
        name: '',
        price: '',
        cost: '',
        category: '',
        description: '',
        image: '',
        available: true
      });
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      cost: item.cost ? item.cost.toString() : '',
      category: item.category,
      description: item.description,
      image: item.image_url || '', // ✅ แก้ไขให้ตรงกับ database
      available: item.available
    });
    setIsAddingItem(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
      setIsLoading(true);
      try {
        await api.deleteMenuItem(itemId);
        alert('ลบเมนูสำเร็จ!');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('เกิดข้อผิดพลาดในการลบเมนู: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setIsAddingItem(false);
    setEditingItem(null);
    setFormData({
      name: '',
      price: '',
      cost: '',
      category: '',
      description: '',
      image: '',
      available: true
    });
  };

  const toggleAvailability = async (item) => {
    setIsLoading(true);
    try {
      await api.updateMenuItem(item.id, { 
        ...item, 
        available: !item.available 
      });
      console.log(`✅ Updated ${item.name} availability to ${!item.available}`);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดต: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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
                <label>ต้นทุน (บาท)</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
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
                <button type="submit" className="save-btn" disabled={isLoading}>
                  {isLoading ? 'กำลังบันทึก...' : (editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="menu-stats">
        <div className="stat-card">
          <h3>เมนูทั้งหมด</h3>
          <p>{safeMenuItems.length}</p>
        </div>
        <div className="stat-card">
          <h3>พร้อมจำหน่าย</h3>
          <p>{safeMenuItems.filter(item => item.available).length}</p>
        </div>
        <div className="stat-card">
          <h3>หมวดหมู่</h3>
          <p>{categories.length}</p>
        </div>
      </div>

      <div className="menu-list">
        {/* Show all menu items if no categories */}
        {categories.length === 0 && safeMenuItems.length > 0 && (
          <div className="category-section">
            <h2 className="category-title">เมนูทั้งหมด</h2>
            <div className="menu-items">
              {safeMenuItems.map(item => (
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
                      disabled={isLoading}
                    >
                      {item.available ? 'ปิดการขาย' : 'เปิดการขาย'}
                    </button>
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(item)}
                      disabled={isLoading}
                    >
                      แก้ไข
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(item.id)}
                      disabled={isLoading}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show by categories if categories exist */}
        {categories.map(category => (
          <div key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            <div className="menu-items">
              {safeMenuItems
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
                        disabled={isLoading}
                      >
                        {item.available ? 'ปิดการขาย' : 'เปิดการขาย'}
                      </button>
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(item)}
                        disabled={isLoading}
                      >
                        แก้ไข
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(item.id)}
                        disabled={isLoading}
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

      {safeMenuItems.length === 0 && (
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
