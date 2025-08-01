import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import './PromotionManagement.css';

function PromotionManagement() {
  const { state, dispatch } = useApp();
  const [isAddingPromotion, setIsAddingPromotion] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: '',
    description: '',
    minAmount: '',
    active: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.value) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด');
      return;
    }

    const promotionData = {
      ...formData,
      value: parseFloat(formData.value),
      minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null
    };

    if (editingPromotion) {
      dispatch({ 
        type: 'UPDATE_PROMOTION', 
        payload: { ...promotionData, id: editingPromotion.id }
      });
      setEditingPromotion(null);
    } else {
      dispatch({ type: 'ADD_PROMOTION', payload: promotionData });
      setIsAddingPromotion(false);
    }

    setFormData({
      name: '',
      type: 'percentage',
      value: '',
      description: '',
      minAmount: '',
      active: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      type: promotion.type,
      value: promotion.value.toString(),
      description: promotion.description,
      minAmount: promotion.minAmount ? promotion.minAmount.toString() : '',
      active: promotion.active,
      startDate: promotion.startDate,
      endDate: promotion.endDate
    });
    setIsAddingPromotion(true);
  };

  const handleDelete = (promotionId) => {
    if (window.confirm('คุณต้องการลบโปรโมชั่นนี้หรือไม่?')) {
      dispatch({ type: 'DELETE_PROMOTION', payload: promotionId });
    }
  };

  const handleCancel = () => {
    setIsAddingPromotion(false);
    setEditingPromotion(null);
    setFormData({
      name: '',
      type: 'percentage',
      value: '',
      description: '',
      minAmount: '',
      active: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const toggleStatus = (promotion) => {
    dispatch({ 
      type: 'UPDATE_PROMOTION', 
      payload: { ...promotion, active: !promotion.active }
    });
  };

  const formatPromotionValue = (promotion) => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}%`;
    } else {
      return `฿${promotion.value}`;
    }
  };

  const isPromotionExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const getPromotionStatus = (promotion) => {
    if (!promotion.active) return 'inactive';
    if (isPromotionExpired(promotion.endDate)) return 'expired';
    if (new Date(promotion.startDate) > new Date()) return 'upcoming';
    return 'active';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'ใช้งานได้';
      case 'inactive': return 'ปิดการใช้งาน';
      case 'expired': return 'หมดอายุ';
      case 'upcoming': return 'ยังไม่เริ่ม';
      default: return 'ไม่ทราบสถานะ';
    }
  };

  return (
    <div className="promotion-management">
      <div className="management-header">
        <h1>จัดการโปรโมชั่น</h1>
        <button 
          className="add-promotion-btn"
          onClick={() => setIsAddingPromotion(true)}
        >
          + เพิ่มโปรโมชั่นใหม่
        </button>
      </div>

      {isAddingPromotion && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingPromotion ? 'แก้ไขโปรโมชั่น' : 'เพิ่มโปรโมชั่นใหม่'}</h2>
              <button className="close-btn" onClick={handleCancel}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="promotion-form">
              <div className="form-group">
                <label>ชื่อโปรโมชั่น *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="เช่น ลด 10% หรือ ลด 50 บาท"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ประเภทส่วนลด *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="percentage">เปอร์เซ็นต์ (%)</option>
                    <option value="fixed">จำนวนเงิน (บาท)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    ค่าส่วนลด * {formData.type === 'percentage' ? '(%)' : '(บาท)'}
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    placeholder={formData.type === 'percentage' ? '10' : '50'}
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    step={formData.type === 'percentage' ? '0.1' : '1'}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>รายละเอียด</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="รายละเอียดของโปรโมชั่น"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>ยอดขั้นต่ำ (บาท)</label>
                <input
                  type="number"
                  name="minAmount"
                  value={formData.minAmount}
                  onChange={handleInputChange}
                  placeholder="เช่น 300 (ไม่ระบุถ้าไม่มีเงื่อนไข)"
                  min="0"
                />
                <small>ไม่ระบุหากไม่มีเงื่อนไขยอดขั้นต่ำ</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>วันที่เริ่มต้น *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>วันที่สิ้นสุด *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                  เปิดใช้งานทันที
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  ยกเลิก
                </button>
                <button type="submit" className="save-btn">
                  {editingPromotion ? 'บันทึกการแก้ไข' : 'เพิ่มโปรโมชั่น'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="promotion-stats">
        <div className="stat-card">
          <h3>โปรโมชั่นทั้งหมด</h3>
          <p>{state.promotions.length}</p>
        </div>
        <div className="stat-card">
          <h3>ใช้งานได้</h3>
          <p>{state.promotions.filter(p => getPromotionStatus(p) === 'active').length}</p>
        </div>
        <div className="stat-card">
          <h3>ปิดการใช้งาน</h3>
          <p>{state.promotions.filter(p => !p.active).length}</p>
        </div>
        <div className="stat-card">
          <h3>หมดอายุ</h3>
          <p>{state.promotions.filter(p => isPromotionExpired(p.endDate)).length}</p>
        </div>
      </div>

      <div className="promotions-list">
        {state.promotions.length === 0 ? (
          <div className="empty-state">
            <h3>ยังไม่มีโปรโมชั่น</h3>
            <p>เริ่มต้นด้วยการสร้างโปรโมชั่นแรกของคุณ</p>
            <button 
              className="add-first-btn"
              onClick={() => setIsAddingPromotion(true)}
            >
              เพิ่มโปรโมชั่นแรก
            </button>
          </div>
        ) : (
          <div className="promotion-grid">
            {state.promotions.map(promotion => {
              const status = getPromotionStatus(promotion);
              return (
                <div key={promotion.id} className={`promotion-card ${status}`}>
                  <div className="promotion-header">
                    <h3>{promotion.name}</h3>
                    <span className={`status-badge ${status}`}>
                      {getStatusText(status)}
                    </span>
                  </div>

                  <div className="promotion-body">
                    <div className="discount-info">
                      <div className="discount-value">
                        {formatPromotionValue(promotion)}
                      </div>
                      <div className="discount-type">
                        {promotion.type === 'percentage' ? 'ส่วนลด' : 'ลดเงิน'}
                      </div>
                    </div>

                    {promotion.description && (
                      <p className="promotion-description">{promotion.description}</p>
                    )}

                    {promotion.minAmount && (
                      <p className="min-amount">
                        ยอดขั้นต่ำ: ฿{promotion.minAmount}
                      </p>
                    )}

                    <div className="date-range">
                      <div>เริ่ม: {new Date(promotion.startDate).toLocaleDateString('th-TH')}</div>
                      <div>สิ้นสุด: {new Date(promotion.endDate).toLocaleDateString('th-TH')}</div>
                    </div>
                  </div>

                  <div className="promotion-actions">
                    <button 
                      className={`toggle-btn ${promotion.active ? 'disable' : 'enable'}`}
                      onClick={() => toggleStatus(promotion)}
                      disabled={status === 'expired'}
                    >
                      {promotion.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    </button>
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(promotion)}
                    >
                      แก้ไข
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(promotion.id)}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PromotionManagement;
