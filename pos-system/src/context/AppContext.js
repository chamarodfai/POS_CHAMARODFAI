import React, { createContext, useContext, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext();

const initialState = {
  // เมนูอาหาร
  menuItems: [
    {
      id: '1',
      name: 'ข้าวผัดกุ้ง',
      price: 80,
      category: 'อาหารจานเดียว',
      description: 'ข้าวผัดกุ้งสดใส่ไข่',
      image: '',
      available: true
    },
    {
      id: '2',
      name: 'ต้มยำกุ้ง',
      price: 120,
      category: 'ต้มยำ',
      description: 'ต้มยำกุ้งน้ำใส รสเปรียวหวาน',
      image: '',
      available: true
    },
    {
      id: '3',
      name: 'น้ำส้มคั้น',
      price: 30,
      category: 'เครื่องดื่ม',
      description: 'น้ำส้มคั้นสด 100%',
      image: '',
      available: true
    }
  ],
  
  // โปรโมชั่น
  promotions: [
    {
      id: '1',
      name: 'ลด 10%',
      type: 'percentage',
      value: 10,
      description: 'ลดราคา 10% สำหรับทุกรายการ',
      active: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      id: '2',
      name: 'ลด 50 บาท',
      type: 'fixed',
      value: 50,
      description: 'ลดราคา 50 บาท เมื่อซื้อครบ 300 บาท',
      minAmount: 300,
      active: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ],
  
  // คำสั่งซื้อ
  orders: [],
  
  // คำสั่งซื้อปัจจุบัน
  currentOrder: {
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    appliedPromotion: null
  },
  
  // ยอดขาย
  salesData: []
};

function appReducer(state, action) {
  switch (action.type) {
    // จัดการเมนู
    case 'ADD_MENU_ITEM':
      return {
        ...state,
        menuItems: [...state.menuItems, { ...action.payload, id: uuidv4() }]
      };
      
    case 'UPDATE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.map(item => 
          item.id === action.payload.id ? action.payload : item
        )
      };
      
    case 'DELETE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.filter(item => item.id !== action.payload)
      };
    
    // จัดการโปรโมชั่น
    case 'ADD_PROMOTION':
      return {
        ...state,
        promotions: [...state.promotions, { ...action.payload, id: uuidv4() }]
      };
      
    case 'UPDATE_PROMOTION':
      return {
        ...state,
        promotions: state.promotions.map(promo => 
          promo.id === action.payload.id ? action.payload : promo
        )
      };
      
    case 'DELETE_PROMOTION':
      return {
        ...state,
        promotions: state.promotions.filter(promo => promo.id !== action.payload)
      };
    
    // จัดการออเดอร์
    case 'ADD_TO_ORDER':
      const existingItem = state.currentOrder.items.find(item => item.id === action.payload.id);
      let updatedItems;
      
      if (existingItem) {
        updatedItems = state.currentOrder.items.map(item =>
          item.id === action.payload.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedItems = [...state.currentOrder.items, { ...action.payload, quantity: 1 }];
      }
      
      const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let discount = 0;
      
      // คำนวณส่วนลด
      if (state.currentOrder.appliedPromotion) {
        const promo = state.currentOrder.appliedPromotion;
        if (promo.type === 'percentage') {
          discount = subtotal * (promo.value / 100);
        } else if (promo.type === 'fixed' && subtotal >= (promo.minAmount || 0)) {
          discount = promo.value;
        }
      }
      
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: updatedItems,
          subtotal,
          discount,
          total: subtotal - discount
        }
      };
    
    case 'REMOVE_FROM_ORDER':
      const filteredItems = state.currentOrder.items.filter(item => item.id !== action.payload);
      const newSubtotal = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let newDiscount = 0;
      
      if (state.currentOrder.appliedPromotion) {
        const promo = state.currentOrder.appliedPromotion;
        if (promo.type === 'percentage') {
          newDiscount = newSubtotal * (promo.value / 100);
        } else if (promo.type === 'fixed' && newSubtotal >= (promo.minAmount || 0)) {
          newDiscount = promo.value;
        }
      }
      
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: filteredItems,
          subtotal: newSubtotal,
          discount: newDiscount,
          total: newSubtotal - newDiscount
        }
      };
    
    case 'UPDATE_QUANTITY':
      const updatedQuantityItems = state.currentOrder.items.map(item =>
        item.id === action.payload.id 
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);
      
      const quantitySubtotal = updatedQuantityItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let quantityDiscount = 0;
      
      if (state.currentOrder.appliedPromotion) {
        const promo = state.currentOrder.appliedPromotion;
        if (promo.type === 'percentage') {
          quantityDiscount = quantitySubtotal * (promo.value / 100);
        } else if (promo.type === 'fixed' && quantitySubtotal >= (promo.minAmount || 0)) {
          quantityDiscount = promo.value;
        }
      }
      
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: updatedQuantityItems,
          subtotal: quantitySubtotal,
          discount: quantityDiscount,
          total: quantitySubtotal - quantityDiscount
        }
      };
    
    case 'APPLY_PROMOTION':
      const currentSubtotal = state.currentOrder.subtotal;
      let promoDiscount = 0;
      
      if (action.payload.type === 'percentage') {
        promoDiscount = currentSubtotal * (action.payload.value / 100);
      } else if (action.payload.type === 'fixed' && currentSubtotal >= (action.payload.minAmount || 0)) {
        promoDiscount = action.payload.value;
      }
      
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          appliedPromotion: action.payload,
          discount: promoDiscount,
          total: currentSubtotal - promoDiscount
        }
      };
    
    case 'REMOVE_PROMOTION':
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          appliedPromotion: null,
          discount: 0,
          total: state.currentOrder.subtotal
        }
      };
    
    case 'COMPLETE_ORDER':
      const completedOrder = {
        id: uuidv4(),
        ...state.currentOrder,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      };
      
      return {
        ...state,
        orders: [...state.orders, completedOrder],
        salesData: [...state.salesData, completedOrder],
        currentOrder: {
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
          appliedPromotion: null
        }
      };
    
    case 'CLEAR_ORDER':
      return {
        ...state,
        currentOrder: {
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
          appliedPromotion: null
        }
      };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
