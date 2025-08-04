import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
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
  
  // สถานะการเชื่อมต่อ Supabase
  supabaseConnected: false,
  
  // สถิติ
  stats: {
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItems: []
  }
};

// Reducer
function appReducer(state, action) {
  try {
    switch (action.type) {
      // การจัดการสถานะการเชื่อมต่อ
      case 'SET_SUPABASE_CONNECTION':
        return {
          ...state,
          supabaseConnected: action.payload
        };
      
      // จัดการเมนู
      case 'SET_MENU_ITEMS':
        return {
          ...state,
          menuItems: action.payload || []
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
          promotions: action.payload || []
        };
        
      case 'ADD_PROMOTION':
        return {
          ...state,
          promotions: [...(state.promotions || []), action.payload]
        };
        
      case 'UPDATE_PROMOTION':
        return {
          ...state,
          promotions: (state.promotions || []).map(promotion => 
            promotion.id === action.payload.id ? action.payload : promotion
          )
        };
        
      case 'DELETE_PROMOTION':
        return {
          ...state,
          promotions: (state.promotions || []).filter(promotion => promotion.id !== action.payload)
        };
      
      // จัดการออเดอร์
      case 'SET_ORDERS':
        return {
          ...state,
          orders: action.payload || []
        };
        
      case 'ADD_ORDER':
        return {
          ...state,
          orders: [...(state.orders || []), action.payload]
        };
      
      // จัดการออเดอร์ปัจจุบัน
      case 'ADD_TO_ORDER':
        const existingItem = (state.currentOrder?.items || []).find(item => item.id === action.payload.id);
        let newItems;
        
        if (existingItem) {
          newItems = (state.currentOrder?.items || []).map(item => 
            item.id === action.payload.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          newItems = [...(state.currentOrder?.items || []), { ...action.payload, quantity: 1 }];
        }
        
        const newSubtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const currentPromotion = state.currentOrder?.appliedPromotion;
        let newDiscount = 0;
        
        if (currentPromotion) {
          if (currentPromotion.type === 'percentage') {
            newDiscount = newSubtotal * (currentPromotion.value / 100);
          } else {
            newDiscount = Math.min(currentPromotion.value, newSubtotal);
          }
        }
        
        return {
          ...state,
          currentOrder: {
            items: newItems,
            subtotal: newSubtotal,
            discount: newDiscount,
            total: newSubtotal - newDiscount,
            appliedPromotion: currentPromotion
          }
        };
      
      case 'REMOVE_FROM_ORDER':
        const filteredItems = (state.currentOrder?.items || []).filter(item => item.id !== action.payload);
        const filteredSubtotal = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const filteredPromotion = state.currentOrder?.appliedPromotion;
        let filteredDiscount = 0;
        
        if (filteredPromotion && filteredSubtotal > 0) {
          if (filteredPromotion.type === 'percentage') {
            filteredDiscount = filteredSubtotal * (filteredPromotion.value / 100);
          } else {
            filteredDiscount = Math.min(filteredPromotion.value, filteredSubtotal);
          }
        }
        
        return {
          ...state,
          currentOrder: {
            items: filteredItems,
            subtotal: filteredSubtotal,
            discount: filteredDiscount,
            total: filteredSubtotal - filteredDiscount,
            appliedPromotion: filteredPromotion
          }
        };
      
      case 'UPDATE_QUANTITY':
        if (action.payload.quantity <= 0) {
          return appReducer(state, { type: 'REMOVE_FROM_ORDER', payload: action.payload.id });
        }
        
        const updatedItems = (state.currentOrder?.items || []).map(item => 
          item.id === action.payload.id 
            ? { ...item, quantity: action.payload.quantity }
            : item
        );
        
        const updatedSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const updatedPromotion = state.currentOrder?.appliedPromotion;
        let updatedDiscount = 0;
        
        if (updatedPromotion) {
          if (updatedPromotion.type === 'percentage') {
            updatedDiscount = updatedSubtotal * (updatedPromotion.value / 100);
          } else {
            updatedDiscount = Math.min(updatedPromotion.value, updatedSubtotal);
          }
        }
        
        return {
          ...state,
          currentOrder: {
            items: updatedItems,
            subtotal: updatedSubtotal,
            discount: updatedDiscount,
            total: updatedSubtotal - updatedDiscount,
            appliedPromotion: updatedPromotion
          }
        };
      
      case 'APPLY_PROMOTION':
        const orderSubtotal = state.currentOrder?.subtotal || 0;
        let promotionDiscount = 0;
        
        if (action.payload.type === 'percentage') {
          promotionDiscount = orderSubtotal * (action.payload.value / 100);
        } else {
          promotionDiscount = Math.min(action.payload.value, orderSubtotal);
        }
        
        return {
          ...state,
          currentOrder: {
            ...(state.currentOrder || {}),
            discount: promotionDiscount,
            total: orderSubtotal - promotionDiscount,
            appliedPromotion: action.payload
          }
        };
      
      case 'REMOVE_PROMOTION':
        return {
          ...state,
          currentOrder: {
            ...(state.currentOrder || {}),
            discount: 0,
            total: state.currentOrder?.subtotal || 0,
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
      
      // จัดการสถานะการโหลด
      case 'SET_LOADING':
        return {
          ...state,
          loading: {
            ...state.loading,
            [action.payload.type]: action.payload.value
          }
        };
      
      // จัดการข้อผิดพลาด
      case 'SET_ERROR':
        return {
          ...state,
          errors: {
            ...state.errors,
            [action.payload.type]: action.payload.error
          }
        };
      
      // จัดการสถิติ
      case 'SET_STATS':
        return {
          ...state,
          stats: action.payload || state.stats
        };
      
      case 'SET_SALES_DATA':
        return {
          ...state,
          salesData: action.payload || []
        };
      
      default:
        return state;
    }
  } catch (error) {
    console.error('Reducer error:', error);
    return state;
  }
}

// Provider Component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ฟังก์ชันจัดการเมนู
  const loadMenuItems = useCallback(async () => {
    try {
      console.log('Loading menu items...');
      dispatch({ type: 'SET_LOADING', payload: { type: 'menuItems', value: true } });
      dispatch({ type: 'SET_ERROR', payload: { type: 'menuItems', error: null } });
      
      const menuItems = await menuItemsAPI.getAll();
      console.log('Menu items loaded:', menuItems);
      dispatch({ type: 'SET_MENU_ITEMS', payload: menuItems });
    } catch (error) {
      console.error('Error loading menu items:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'menuItems', error: error.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'menuItems', value: false } });
    }
  }, []);

  const addMenuItem = useCallback(async (menuItem) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'menuItems', value: true } });
      const newItem = await menuItemsAPI.create(menuItem);
      dispatch({ type: 'ADD_MENU_ITEM', payload: newItem });
      return newItem;
    } catch (error) {
      console.error('Error adding menu item:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'menuItems', error: error.message } });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'menuItems', value: false } });
    }
  }, []);

  const updateMenuItem = useCallback(async (id, updates) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'menuItems', value: true } });
      const updatedItem = await menuItemsAPI.update(id, updates);
      dispatch({ type: 'UPDATE_MENU_ITEM', payload: updatedItem });
      return updatedItem;
    } catch (error) {
      console.error('Error updating menu item:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'menuItems', error: error.message } });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'menuItems', value: false } });
    }
  }, []);

  const deleteMenuItem = useCallback(async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'menuItems', value: true } });
      await menuItemsAPI.delete(id);
      dispatch({ type: 'DELETE_MENU_ITEM', payload: id });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'menuItems', error: error.message } });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'menuItems', value: false } });
    }
  }, []);

  // ฟังก์ชันจัดการโปรโมชั่น
  const loadPromotions = useCallback(async () => {
    try {
      console.log('Loading promotions...');
      dispatch({ type: 'SET_LOADING', payload: { type: 'promotions', value: true } });
      dispatch({ type: 'SET_ERROR', payload: { type: 'promotions', error: null } });
      
      const promotions = await promotionsAPI.getAll();
      console.log('Promotions loaded:', promotions);
      dispatch({ type: 'SET_PROMOTIONS', payload: promotions });
    } catch (error) {
      console.error('Error loading promotions:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'promotions', error: error.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'promotions', value: false } });
    }
  }, []);

  const addPromotion = useCallback(async (promotion) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'promotions', value: true } });
      const newPromotion = await promotionsAPI.create(promotion);
      dispatch({ type: 'ADD_PROMOTION', payload: newPromotion });
      return newPromotion;
    } catch (error) {
      console.error('Error adding promotion:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'promotions', error: error.message } });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'promotions', value: false } });
    }
  }, []);

  const updatePromotion = useCallback(async (id, updates) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'promotions', value: true } });
      const updatedPromotion = await promotionsAPI.update(id, updates);
      dispatch({ type: 'UPDATE_PROMOTION', payload: updatedPromotion });
      return updatedPromotion;
    } catch (error) {
      console.error('Error updating promotion:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'promotions', error: error.message } });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'promotions', value: false } });
    }
  }, []);

  const deletePromotion = useCallback(async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'promotions', value: true } });
      await promotionsAPI.delete(id);
      dispatch({ type: 'DELETE_PROMOTION', payload: id });
    } catch (error) {
      console.error('Error deleting promotion:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'promotions', error: error.message } });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'promotions', value: false } });
    }
  }, []);

  // ฟังก์ชันจัดการออเดอร์
  const loadRecentOrders = useCallback(async () => {
    try {
      console.log('Loading recent orders...');
      dispatch({ type: 'SET_LOADING', payload: { type: 'orders', value: true } });
      dispatch({ type: 'SET_ERROR', payload: { type: 'orders', error: null } });
      
      const orders = await ordersAPI.getRecent(50);
      console.log('Recent orders loaded:', orders);
      dispatch({ type: 'SET_ORDERS', payload: orders });
    } catch (error) {
      console.error('Error loading recent orders:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'orders', error: error.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'orders', value: false } });
    }
  }, []);

  const completeOrder = useCallback(async () => {
    try {
      if (!state.currentOrder || state.currentOrder.items.length === 0) {
        throw new Error('ไม่มีรายการสั่งซื้อ');
      }

      dispatch({ type: 'SET_LOADING', payload: { type: 'orders', value: true } });
      
      const orderData = {
        items: state.currentOrder.items,
        subtotal: state.currentOrder.subtotal,
        discount: state.currentOrder.discount,
        total: state.currentOrder.total,
        appliedPromotion: state.currentOrder.appliedPromotion
      };

      const result = await ordersAPI.create(orderData);
      
      dispatch({ type: 'ADD_ORDER', payload: result });
      dispatch({ type: 'CLEAR_ORDER' });
      
      // รีโหลดออเดอร์ล่าสุด
      await loadRecentOrders();
      
      return result;
    } catch (error) {
      console.error('Error completing order:', error);
      dispatch({ type: 'SET_ERROR', payload: { type: 'orders', error: error.message } });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'orders', value: false } });
    }
  }, [state.currentOrder, loadRecentOrders]);

  // ฟังก์ชันจัดการออเดอร์ปัจจุบัน
  const addToOrder = useCallback((item) => {
    dispatch({ type: 'ADD_TO_ORDER', payload: item });
  }, []);

  const removeFromOrder = useCallback((itemId) => {
    dispatch({ type: 'REMOVE_FROM_ORDER', payload: itemId });
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  }, []);

  const applyPromotion = useCallback((promotion) => {
    dispatch({ type: 'APPLY_PROMOTION', payload: promotion });
  }, []);

  const removePromotion = useCallback(() => {
    dispatch({ type: 'REMOVE_PROMOTION' });
  }, []);

  const clearOrder = useCallback(() => {
    dispatch({ type: 'CLEAR_ORDER' });
  }, []);

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
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
  }, [loadMenuItems, loadPromotions, loadRecentOrders]);

  const value = {
    state,
    dispatch,
    // Menu functions
    loadMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    // Promotion functions
    loadPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    // Order functions
    loadRecentOrders,
    completeOrder,
    // Current order functions
    addToOrder,
    removeFromOrder,
    updateQuantity,
    applyPromotion,
    removePromotion,
    clearOrder
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
