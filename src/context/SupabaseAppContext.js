import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  menuItemsAPI, 
  promotionsAPI, 
  ordersAPI, 
  statsAPI, 
  utilsAPI 
} from '../utils/supabaseAPI';

const AppContext = createContext();

const initialState = {
  // เมนูอาหาร
  menuItems: [],
  
  // โปรโมชั่น
  promotions: [],
  
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
  salesData: [],
  
  // สถานะการโหลด
  loading: {
    menuItems: false,
    promotions: false,
    orders: false,
    stats: false
  },
  
  // ข้อผิดพลาด
  errors: {
    menuItems: null,
    promotions: null,
    orders: null,
    stats: null
  },
  
  // การเชื่อมต่อ Supabase
  supabaseConnected: false
};

function appReducer(state, action) {
  switch (action.type) {
    // การจัดการสถานะ Loading
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.value
        }
      };
    
    // การจัดการข้อผิดพลาด
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.type]: action.payload.error
        }
      };
    
    // การจัดการการเชื่อมต่อ Supabase
    case 'SET_SUPABASE_CONNECTION':
      return {
        ...state,
        supabaseConnected: action.payload
      };
    
    // จัดการเมนู
    case 'SET_MENU_ITEMS':
      return {
        ...state,
        menuItems: action.payload
      };
      
    case 'ADD_MENU_ITEM':
      return {
        ...state,
        menuItems: [...(state.menuItems || []), action.payload]
      };
      
    case 'UPDATE_MENU_ITEM':
      return {
        ...state,
        menuItems: (state.menuItems || []).map(item => 
          item.id === action.payload.id ? action.payload : item
        )
      };
      
    case 'DELETE_MENU_ITEM':
      return {
        ...state,
        menuItems: (state.menuItems || []).filter(item => item.id !== action.payload)
      };
    
    // จัดการโปรโมชั่น
    case 'SET_PROMOTIONS':
      return {
        ...state,
        promotions: action.payload
      };
      
    case 'ADD_PROMOTION':
      return {
        ...state,
        promotions: [...state.promotions, action.payload]
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
    
    // จัดการออเดอร์ปัจจุบัน (Local State)
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
        } else if (promo.type === 'fixed' && subtotal >= (promo.min_amount || 0)) {
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
        } else if (promo.type === 'fixed' && newSubtotal >= (promo.min_amount || 0)) {
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
        } else if (promo.type === 'fixed' && quantitySubtotal >= (promo.min_amount || 0)) {
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
      } else if (action.payload.type === 'fixed' && currentSubtotal >= (action.payload.min_amount || 0)) {
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
    
    // จัดการออเดอร์ที่บันทึกแล้ว
    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload,
        salesData: action.payload
      };
    
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        salesData: [action.payload, ...state.salesData]
      };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // ทดสอบการเชื่อมต่อ Supabase เมื่อเริ่มต้น
  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await utilsAPI.testConnection();
        dispatch({ 
          type: 'SET_SUPABASE_CONNECTION', 
          payload: result.success 
        });
        
        if (result.success) {
          // โหลดข้อมูลเริ่มต้น
          await loadInitialData();
        } else {
          console.error('Supabase connection failed:', result.message);
        }
      } catch (error) {
        console.error('Error testing Supabase connection:', error);
        dispatch({ 
          type: 'SET_SUPABASE_CONNECTION', 
          payload: false 
        });
      }
    };
    
    testConnection();
  }, []);
  
  // โหลดข้อมูลเริ่มต้น
  const loadInitialData = async () => {
    try {
      // โหลดเมนู
      await loadMenuItems();
      
      // โหลดโปรโมชั่น
      await loadPromotions();
      
      // โหลดออเดอร์ล่าสุด
      await loadRecentOrders();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };
  
  // ฟังก์ชันจัดการเมนู
  const loadMenuItems = async () => {
    try {
      console.log('Loading menu items...');
      dispatch({ type: 'SET_LOADING', payload: { type: 'menuItems', value: true } });
      dispatch({ type: 'SET_ERROR', payload: { type: 'menuItems', error: null } });
      
      const menuItems = await menuItemsAPI.getAll();
      console.log('Menu items loaded:', menuItems);
      dispatch({ type: 'SET_MENU_ITEMS', payload: menuItems });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { type: 'menuItems', error: error.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'menuItems', value: false } });
    }
  };
  
  const addMenuItem = async (menuItem) => {
    try {
      const newItem = await menuItemsAPI.create(menuItem);
      dispatch({ type: 'ADD_MENU_ITEM', payload: newItem });
      return newItem;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { type: 'menuItems', error: error.message } });
      throw error;
    }
  };
  
  const updateMenuItem = async (id, menuItem) => {
    try {
      const updatedItem = await menuItemsAPI.update(id, menuItem);
      dispatch({ type: 'UPDATE_MENU_ITEM', payload: updatedItem });
      return updatedItem;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { type: 'menuItems', error: error.message } });
      throw error;
    }
  };
  
  const deleteMenuItem = async (id) => {
    try {
      await menuItemsAPI.delete(id);
      dispatch({ type: 'DELETE_MENU_ITEM', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { type: 'menuItems', error: error.message } });
      throw error;
    }
  };
  
  // ฟังก์ชันจัดการโปรโมชั่น
  const loadPromotions = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'promotions', value: true } });
      dispatch({ type: 'SET_ERROR', payload: { type: 'promotions', error: null } });
      
      const promotions = await promotionsAPI.getAll();
      dispatch({ type: 'SET_PROMOTIONS', payload: promotions });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { type: 'promotions', error: error.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'promotions', value: false } });
    }
  };
  
  const addPromotion = async (promotion) => {
    try {
      const newPromotion = await promotionsAPI.create(promotion);
      dispatch({ type: 'ADD_PROMOTION', payload: newPromotion });
      return newPromotion;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { type: 'promotions', error: error.message } });
      throw error;
    }
  };
  
  const updatePromotion = async (id, promotion) => {
    try {
      const updatedPromotion = await promotionsAPI.update(id, promotion);
      dispatch({ type: 'UPDATE_PROMOTION', payload: updatedPromotion });
      return updatedPromotion;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { type: 'promotions', error: error.message } });
      throw error;
    }
  };
  
  const deletePromotion = async (id) => {
    try {
      await promotionsAPI.delete(id);
      dispatch({ type: 'DELETE_PROMOTION', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { type: 'promotions', error: error.message } });
      throw error;
    }
  };
  
  // ฟังก์ชันจัดการออเดอร์ 
  const loadRecentOrders = useCallback(async (limit = 50) => {
    // ป้องกันการเรียกซ้ำถ้าทำงานอยู่แล้ว
    if (state.loading.orders) {
      console.log('Orders already loading, skipping...');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'orders', value: true } });
      dispatch({ type: 'SET_ERROR', payload: { type: 'orders', error: null } });
      
      const orders = await ordersAPI.getAll(limit);
      console.log('Orders loaded:', orders);
      dispatch({ type: 'SET_ORDERS', payload: orders });
    } catch (error) {
      console.error('Error loading orders:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'orders', error: error.message } });
      // ถ้า error ให้ set เป็น array ว่างเพื่อไม่ให้ app crash
      dispatch({ type: 'SET_ORDERS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'orders', value: false } });
    }
  }, [state.loading.orders]);
  
  const completeOrder = async () => {
    try {
      if (state.currentOrder.items.length === 0) {
        throw new Error('ไม่มีรายการสินค้าในออเดอร์');
      }
      
      console.log('Creating order:', state.currentOrder);
      
      // สร้างออเดอร์ใหม่
      const orderData = {
        subtotal: state.currentOrder.subtotal,
        discount: state.currentOrder.discount,
        total: state.currentOrder.total,
        appliedPromotion: state.currentOrder.appliedPromotion,
        items: state.currentOrder.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          cost: item.cost || 0,
          quantity: item.quantity
        }))
      };
      
      const newOrder = await ordersAPI.create(orderData);
      console.log('Order created successfully:', newOrder);
      
      dispatch({ type: 'ADD_ORDER', payload: newOrder });
      dispatch({ type: 'CLEAR_ORDER' });
      
      // อัปเดตสถิติรายวัน
      await statsAPI.updateDailyStats();
      
      return newOrder;
    } catch (error) {
      console.error('Error completing order:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'orders', error: error.message } });
      throw error;
    }
  };
  
  // ฟังก์ชันจัดการออเดอร์ปัจจุบัน (Local)
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
  };
  
  const removePromotion = () => {
    dispatch({ type: 'REMOVE_PROMOTION' });
  };
  
  const clearOrder = () => {
    dispatch({ type: 'CLEAR_ORDER' });
  };
  
  const value = {
    state,
    dispatch,
    // เมนู
    loadMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    // โปรโมชั่น
    loadPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    // ออเดอร์
    loadRecentOrders,
    completeOrder,
    // ออเดอร์ปัจจุบัน
    addToOrder,
    removeFromOrder,
    updateQuantity,
    applyPromotion,
    removePromotion,
    clearOrder,
    // สถิติ
    statsAPI
  };
  
  return (
    <AppContext.Provider value={value}>
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
