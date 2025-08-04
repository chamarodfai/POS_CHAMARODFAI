import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { menuItemsAPI, promotionsAPI, ordersAPI, utilsAPI } from '../utils/supabaseAPI';

// ================================
// CONTEXT CREATION
// ================================

const SimpleAppContext = createContext();

// ================================
// ACTION TYPES
// ================================

const ActionTypes = {
  SET_MENU_ITEMS: 'SET_MENU_ITEMS',
  ADD_MENU_ITEM: 'ADD_MENU_ITEM',
  UPDATE_MENU_ITEM: 'UPDATE_MENU_ITEM',
  DELETE_MENU_ITEM: 'DELETE_MENU_ITEM',
  SET_PROMOTIONS: 'SET_PROMOTIONS',
  ADD_PROMOTION: 'ADD_PROMOTION',
  UPDATE_PROMOTION: 'UPDATE_PROMOTION',
  DELETE_PROMOTION: 'DELETE_PROMOTION',
  SET_ORDERS: 'SET_ORDERS',
  ADD_ORDER: 'ADD_ORDER',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// ================================
// REDUCER
// ================================

const initialState = {
  menuItems: [],
  promotions: [],
  orders: [],
  connectionStatus: null,
  loading: false,
  error: null,
  fallbackMode: false // เพิ่ม fallback mode
};

function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_MENU_ITEMS:
      return { ...state, menuItems: action.payload };
    
    case ActionTypes.ADD_MENU_ITEM:
      return { ...state, menuItems: [action.payload, ...state.menuItems] };
    
    case ActionTypes.UPDATE_MENU_ITEM:
      return {
        ...state,
        menuItems: state.menuItems.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    
    case ActionTypes.DELETE_MENU_ITEM:
      return {
        ...state,
        menuItems: state.menuItems.filter(item => item.id !== action.payload)
      };
    
    case ActionTypes.SET_PROMOTIONS:
      return { ...state, promotions: action.payload };
    
    case ActionTypes.ADD_PROMOTION:
      return { ...state, promotions: [action.payload, ...state.promotions] };
    
    case ActionTypes.UPDATE_PROMOTION:
      return {
        ...state,
        promotions: state.promotions.map(promo =>
          promo.id === action.payload.id ? action.payload : promo
        )
      };
    
    case ActionTypes.DELETE_PROMOTION:
      return {
        ...state,
        promotions: state.promotions.filter(promo => promo.id !== action.payload)
      };
    
    case ActionTypes.SET_ORDERS:
      return { ...state, orders: action.payload };
    
    case ActionTypes.ADD_ORDER:
      return { ...state, orders: [action.payload, ...state.orders] };
    
    case ActionTypes.SET_CONNECTION_STATUS:
      return { ...state, connectionStatus: action.payload };
    
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
    default:
      return state;
  }
}

// ================================
// CONTEXT PROVIDER
// ================================

export function SimpleAppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ================================
  // API FUNCTIONS
  // ================================

  const api = {
    // Test Connection
    async testConnection() {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const result = await utilsAPI.testConnection();
        dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: result });
        return result;
      } catch (error) {
        console.warn('❌ Connection test failed:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        return { success: false, message: error.message };
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    // Menu Items
    async loadMenuItems() {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        console.log('🔄 Loading menu items from Supabase...');
        const items = await menuItemsAPI.getAll();
        console.log('✅ Menu items loaded:', items);
        dispatch({ type: ActionTypes.SET_MENU_ITEMS, payload: items || [] });
        return items || [];
      } catch (error) {
        console.error('❌ Error loading menu items:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        // Return empty array on error to prevent crashes
        dispatch({ type: ActionTypes.SET_MENU_ITEMS, payload: [] });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async createMenuItem(menuItem) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        
        // Try Supabase first
        try {
          const newItem = await menuItemsAPI.create(menuItem);
          dispatch({ type: ActionTypes.ADD_MENU_ITEM, payload: newItem });
          console.log('✅ Menu item created in Supabase:', newItem);
          return newItem;
        } catch (supabaseError) {
          console.warn('⚠️ Supabase create failed, using mock mode:', supabaseError);
          
          // Fallback to mock creation
          const mockItem = {
            id: Date.now(), // Simple ID generation
            ...menuItem,
            available: menuItem.available !== false,
            cost: menuItem.cost || 0,
            description: menuItem.description || '',
            category: menuItem.category || 'ทั่วไป'
          };
          
          dispatch({ type: ActionTypes.ADD_MENU_ITEM, payload: mockItem });
          console.log('✅ Menu item created in mock mode:', mockItem);
          return mockItem;
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async updateMenuItem(id, menuItem) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        
        // Try Supabase first
        try {
          const updatedItem = await menuItemsAPI.update(id, menuItem);
          dispatch({ type: ActionTypes.UPDATE_MENU_ITEM, payload: updatedItem });
          console.log('✅ Menu item updated in Supabase:', updatedItem);
          return updatedItem;
        } catch (supabaseError) {
          console.warn('⚠️ Supabase update failed, using mock mode:', supabaseError);
          
          // Fallback to mock update
          const mockUpdatedItem = {
            id: id,
            ...menuItem,
            available: menuItem.available !== false,
            cost: menuItem.cost || 0,
            description: menuItem.description || '',
            category: menuItem.category || 'ทั่วไป'
          };
          
          dispatch({ type: ActionTypes.UPDATE_MENU_ITEM, payload: mockUpdatedItem });
          console.log('✅ Menu item updated in mock mode:', mockUpdatedItem);
          return mockUpdatedItem;
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async deleteMenuItem(id) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        
        // Try Supabase first
        try {
          await menuItemsAPI.delete(id);
          dispatch({ type: ActionTypes.DELETE_MENU_ITEM, payload: id });
          console.log('✅ Menu item deleted from Supabase:', id);
        } catch (supabaseError) {
          console.warn('⚠️ Supabase delete failed, using mock mode:', supabaseError);
          
          // Fallback to mock delete
          dispatch({ type: ActionTypes.DELETE_MENU_ITEM, payload: id });
          console.log('✅ Menu item deleted in mock mode:', id);
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    // Promotions
    async loadPromotions() {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const promotions = await promotionsAPI.getAll();
        dispatch({ type: ActionTypes.SET_PROMOTIONS, payload: promotions });
        return promotions;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async createPromotion(promotion) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const newPromotion = await promotionsAPI.create(promotion);
        dispatch({ type: ActionTypes.ADD_PROMOTION, payload: newPromotion });
        return newPromotion;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async updatePromotion(id, promotion) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const updatedPromotion = await promotionsAPI.update(id, promotion);
        dispatch({ type: ActionTypes.UPDATE_PROMOTION, payload: updatedPromotion });
        return updatedPromotion;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async deletePromotion(id) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        await promotionsAPI.delete(id);
        dispatch({ type: ActionTypes.DELETE_PROMOTION, payload: id });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    // Orders
    async loadOrders() {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const orders = await ordersAPI.getRecent();
        dispatch({ type: ActionTypes.SET_ORDERS, payload: orders });
        return orders;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async loadRecentOrders(limit = 100) {
      try {
        console.log('🔄 Loading recent orders (limit:', limit, ')');
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        
        // Mock orders data สำหรับตอนนี้
        const mockOrders = [
          {
            id: 1,
            items: [
              { name: 'กาแฟดำ', price: 45, quantity: 2 },
              { name: 'ขนมปัง', price: 25, quantity: 1 }
            ],
            total: 115,
            created_at: new Date().toISOString(),
            status: 'completed'
          },
          {
            id: 2,
            items: [
              { name: 'ข้าวผัดกุ้ง', price: 120, quantity: 1 }
            ],
            total: 120,
            created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            status: 'completed'
          },
          {
            id: 3,
            items: [
              { name: 'สมิตา', price: 60, quantity: 3 },
              { name: 'ชาเย็น', price: 35, quantity: 2 }
            ],
            total: 250,
            created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            status: 'completed'
          }
        ];
        
        dispatch({ type: ActionTypes.SET_ORDERS, payload: mockOrders });
        console.log('✅ Loaded', mockOrders.length, 'recent orders');
        return mockOrders;
      } catch (error) {
        console.error('❌ Error loading recent orders:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async createOrder(order) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const newOrder = await ordersAPI.create(order);
        dispatch({ type: ActionTypes.ADD_ORDER, payload: newOrder });
        return newOrder;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    // Utility Functions
    clearError() {
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });
    }
  };

  // ================================
  // INITIAL DATA LOAD
  // ================================

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('🔄 Initializing POS app...');
        
        // Test connection first
        const connectionResult = await api.testConnection();
        console.log('Connection test result:', connectionResult);
        
        if (connectionResult.success) {
          // Try to load menu items from Supabase
          try {
            await api.loadMenuItems();
            console.log('✅ Menu items loaded from Supabase successfully');
          } catch (menuError) {
            console.warn('⚠️ Failed to load menu items from Supabase, using fallback data');
            // Set comprehensive fallback menu items
            const fallbackMenuItems = [
              {
                id: 1,
                name: 'กาแฟดำ',
                price: 45,
                category: 'เครื่องดื่ม',
                description: 'กาแฟดำข้น',
                available: true,
                cost: 25,
                image_url: null
              },
              {
                id: 2,
                name: 'ข้าวผัดกุ้ง',
                price: 120,
                category: 'อาหารจานหลัก',
                description: 'ข้าวผัดกุ้งสด',
                available: true,
                cost: 70,
                image_url: null
              },
              {
                id: 3,
                name: 'สมิตา',
                price: 60,
                category: 'เครื่องดื่ม',
                description: 'สมิตาใหม่',
                available: true,
                cost: 35,
                image_url: null
              },
              {
                id: 4,
                name: 'ผัดไทย',
                price: 80,
                category: 'อาหารจานหลัก',
                description: 'ผัดไทยใส่ไข่',
                available: true,
                cost: 50,
                image_url: null
              },
              {
                id: 5,
                name: 'ชาเย็น',
                price: 35,
                category: 'เครื่องดื่ม',
                description: 'ชาเย็นหวานมัน',
                available: true,
                cost: 20,
                image_url: null
              }
            ];
            dispatch({ type: ActionTypes.SET_MENU_ITEMS, payload: fallbackMenuItems });
          }
        } else {
          console.warn('⚠️ Connection test failed, using fallback mode');
          // Use fallback data
          const mockMenuItems = [
            {
              id: 1,
              name: 'กาแฟดำ',
              price: 45,
              category: 'เครื่องดื่ม',
              description: 'กาแฟดำข้น',
              available: true,
              cost: 25,
              image_url: null
            },
            {
              id: 2,
              name: 'ข้าวผัดกุ้ง',
              price: 120,
              category: 'อาหารจานหลัก',
              description: 'ข้าวผัดกุ้งสด',
              available: true,
              cost: 70,
              image_url: null
            },
            {
              id: 3,
              name: 'สมิตา',
              price: 60,
              category: 'เครื่องดื่ม',
              description: 'สมิตาใหม่',
              available: true,
              cost: 35,
              image_url: null
            }
          ];
          dispatch({ type: ActionTypes.SET_MENU_ITEMS, payload: mockMenuItems });
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'ไม่สามารถโหลดข้อมูลได้' });
      }
    }

    initializeApp();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ================================
  // CONTEXT VALUE
  // ================================

  const contextValue = {
    ...state,
    api
  };

  return (
    <SimpleAppContext.Provider value={contextValue}>
      {children}
    </SimpleAppContext.Provider>
  );
}

// ================================
// CUSTOM HOOK
// ================================

export function useSimpleApp() {
  const context = useContext(SimpleAppContext);
  if (!context) {
    throw new Error('useSimpleApp must be used within a SimpleAppProvider');
  }
  return context;
}

export default SimpleAppContext;
