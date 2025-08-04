import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  menuItemsAPI, 
  promotionsAPI, 
  ordersAPI, 
  utilsAPI 
} from '../utils/apiRouter';

const SimpleAppContext = createContext();

// Simple Provider ที่ใช้ useState แทน useReducer
export function SimpleAppProvider({ children }) {
  // Simple state management
  const [menuItems, setMenuItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState({
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    appliedPromotion: null
  });
  const [loading, setLoading] = useState({
    menuItems: false,
    promotions: false,
    orders: false
  });
  const [connected, setConnected] = useState(false);

  // Simple functions
  const loadMenuItems = async () => {
    try {
      setLoading(prev => ({ ...prev, menuItems: true }));
      const data = await menuItemsAPI.getAll();
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
      setMenuItems([]);
    } finally {
      setLoading(prev => ({ ...prev, menuItems: false }));
    }
  };

  const loadPromotions = async () => {
    try {
      setLoading(prev => ({ ...prev, promotions: true }));
      const data = await promotionsAPI.getAll();
      setPromotions(data || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
      setPromotions([]);
    } finally {
      setLoading(prev => ({ ...prev, promotions: false }));
    }
  };

  const loadRecentOrders = async () => {
    try {
      setLoading(prev => ({ ...prev, orders: true }));
      const data = await ordersAPI.getRecent(50);
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  // Simple order management
  const addToOrder = (item) => {
    if (!item) return;
    
    setCurrentOrder(prev => {
      const existingItem = prev.items.find(orderItem => orderItem.id === item.id);
      let newItems;
      
      if (existingItem) {
        newItems = prev.items.map(orderItem => 
          orderItem.id === item.id 
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      } else {
        newItems = [...prev.items, { ...item, quantity: 1 }];
      }
      
      const newSubtotal = newItems.reduce((sum, orderItem) => 
        sum + (orderItem.price * orderItem.quantity), 0
      );
      
      let newDiscount = 0;
      if (prev.appliedPromotion) {
        if (prev.appliedPromotion.type === 'percentage') {
          newDiscount = newSubtotal * (prev.appliedPromotion.value / 100);
        } else {
          newDiscount = prev.appliedPromotion.value;
        }
      }
      
      return {
        ...prev,
        items: newItems,
        subtotal: newSubtotal,
        discount: newDiscount,
        total: newSubtotal - newDiscount
      };
    });
  };

  const removeFromOrder = (itemId) => {
    setCurrentOrder(prev => {
      const newItems = prev.items.filter(item => item.id !== itemId);
      const newSubtotal = newItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      let newDiscount = 0;
      if (prev.appliedPromotion) {
        if (prev.appliedPromotion.type === 'percentage') {
          newDiscount = newSubtotal * (prev.appliedPromotion.value / 100);
        } else {
          newDiscount = prev.appliedPromotion.value;
        }
      }
      
      return {
        ...prev,
        items: newItems,
        subtotal: newSubtotal,
        discount: newDiscount,
        total: newSubtotal - newDiscount
      };
    });
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromOrder(itemId);
      return;
    }
    
    setCurrentOrder(prev => {
      const newItems = prev.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      );
      
      const newSubtotal = newItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      let newDiscount = 0;
      if (prev.appliedPromotion) {
        if (prev.appliedPromotion.type === 'percentage') {
          newDiscount = newSubtotal * (prev.appliedPromotion.value / 100);
        } else {
          newDiscount = prev.appliedPromotion.value;
        }
      }
      
      return {
        ...prev,
        items: newItems,
        subtotal: newSubtotal,
        discount: newDiscount,
        total: newSubtotal - newDiscount
      };
    });
  };

  const applyPromotion = (promotion) => {
    if (!promotion) return;
    
    setCurrentOrder(prev => {
      let newDiscount = 0;
      if (promotion.type === 'percentage') {
        newDiscount = prev.subtotal * (promotion.value / 100);
      } else {
        newDiscount = promotion.value;
      }
      
      return {
        ...prev,
        appliedPromotion: promotion,
        discount: newDiscount,
        total: prev.subtotal - newDiscount
      };
    });
  };

  const removePromotion = () => {
    setCurrentOrder(prev => ({
      ...prev,
      appliedPromotion: null,
      discount: 0,
      total: prev.subtotal
    }));
  };

  const clearOrder = () => {
    setCurrentOrder({
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      appliedPromotion: null
    });
  };

  const completeOrder = async () => {
    try {
      if (!currentOrder.items || currentOrder.items.length === 0) {
        throw new Error('ไม่มีรายการสั่งซื้อ');
      }

      const orderData = {
        order_items: currentOrder.items.map(item => ({
          menu_item_id: item.id,
          menu_item_name: item.name,
          menu_item_price: item.price,
          quantity: item.quantity
        })),
        subtotal: currentOrder.subtotal,
        discount: currentOrder.discount,
        total: currentOrder.total,
        applied_promotion: currentOrder.appliedPromotion ? {
          id: currentOrder.appliedPromotion.id,
          name: currentOrder.appliedPromotion.name,
          type: currentOrder.appliedPromotion.type,
          value: currentOrder.appliedPromotion.value
        } : null,
        order_time: new Date().toISOString()
      };

      const result = await ordersAPI.create(orderData);
      
      // Clear current order after successful creation
      clearOrder();
      
      // Reload orders to update the list
      await loadRecentOrders();
      
      return result;
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  };

  // Menu management functions
  const addMenuItem = async (itemData) => {
    try {
      const newItem = await menuItemsAPI.create(itemData);
      setMenuItems(prev => [...prev, newItem]);
      return newItem;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  };

  const updateMenuItem = async (id, updates) => {
    try {
      const updatedItem = await menuItemsAPI.update(id, updates);
      setMenuItems(prev => 
        prev.map(item => item.id === id ? updatedItem : item)
      );
      return updatedItem;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await menuItemsAPI.delete(id);
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  };

  // Promotion management functions
  const addPromotion = async (promotionData) => {
    try {
      const newPromotion = await promotionsAPI.create(promotionData);
      setPromotions(prev => [...prev, newPromotion]);
      return newPromotion;
    } catch (error) {
      console.error('Error adding promotion:', error);
      throw error;
    }
  };

  const updatePromotion = async (id, updates) => {
    try {
      const updatedPromotion = await promotionsAPI.update(id, updates);
      setPromotions(prev => 
        prev.map(promotion => promotion.id === id ? updatedPromotion : promotion)
      );
      return updatedPromotion;
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }
  };

  const deletePromotion = async (id) => {
    try {
      await promotionsAPI.delete(id);
      setPromotions(prev => prev.filter(promotion => promotion.id !== id));
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const connectionResult = await utilsAPI.testConnection();
        setConnected(connectionResult.success);
        
        if (connectionResult.success) {
          await Promise.all([
            loadMenuItems(),
            loadPromotions(),
            loadRecentOrders()
          ]);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setConnected(false);
      }
    };

    initializeData();
  }, []);

  // Simple state object
  const state = {
    menuItems,
    promotions,
    orders,
    currentOrder,
    loading,
    supabaseConnected: connected
  };

  const value = {
    state,
    loadMenuItems,
    loadPromotions,
    loadRecentOrders,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    applyPromotion,
    removePromotion,
    clearOrder,
    completeOrder,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addPromotion,
    updatePromotion,
    deletePromotion
  };

  return (
    <SimpleAppContext.Provider value={value}>
      {children}
    </SimpleAppContext.Provider>
  );
}

export function useSimpleApp() {
  const context = useContext(SimpleAppContext);
  if (!context) {
    throw new Error('useSimpleApp must be used within a SimpleAppProvider');
  }
  return context;
}
