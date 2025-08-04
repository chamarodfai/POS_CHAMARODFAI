import supabase from '../config/supabase';

// ================================
// MENU ITEMS FUNCTIONS
// ================================

export const menuItemsAPI = {
  async getAll() {
    try {
      console.log('🔄 Attempting to fetch all menu items from Supabase...');
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) {
        console.error('❌ Supabase Error Details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: error.status || 'Unknown'
        });
        
        // แสดงข้อความช่วยเหลือตาม error code
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.error('💡 Solution: ตาราง menu_items ยังไม่มีใน Database');
          console.error('🔧 Action: รัน COMPLETE_DATABASE_SETUP.sql ใน Supabase SQL Editor');
        } else if (error.code === '401' || error.message?.includes('JWT') || error.message?.includes('invalid')) {
          console.error('💡 Solution: API Key ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง');
          console.error('🔧 Action: ตรวจสอบ supabase.js และใช้ service_role key');
        }
        
        throw error;
      }
      
      console.log('✅ Successfully fetched', data?.length || 0, 'menu items from Supabase');
      
      // Ensure all items have required fields with defaults
      const normalizedData = (data || []).map(item => ({
        ...item,
        available: item.available !== undefined ? item.available : true,
        category: item.category || 'ทั่วไป',
        cost: item.cost || 0,
        description: item.description || ''
      }));
      
      return normalizedData;
    } catch (error) {
      console.error('❌ Error fetching menu items:', error);
      throw error;
    }
  },

  async getAvailable() {
    try {
      // Try to get available items, fallback to all items if 'available' column doesn't exist
      let { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.warn('Error getting available items, falling back to all items:', error);
        // Fallback: get all items
        const fallback = await supabase.from('menu_items').select('*');
        data = fallback.data;
      }
      
      // Normalize data and filter available items
      const normalizedData = (data || []).map(item => ({
        ...item,
        available: item.available !== undefined ? item.available : true,
        category: item.category || 'ทั่วไป',
        cost: item.cost || 0,
        description: item.description || ''
      }));
      
      return normalizedData.filter(item => item.available);
    } catch (error) {
      console.error('Error fetching available menu items:', error);
      throw error;
    }
  },

  async create(menuItem) {
    try {
      console.log('🔄 Creating menu item in Supabase:', menuItem);
      
      const insertData = {
        name: menuItem.name,
        price: menuItem.price,
        cost: menuItem.cost || 0,
        category: menuItem.category,
        description: menuItem.description || '',
        available: menuItem.available !== false
      };
      
      // Only add image_url if it exists and is not empty
      if (menuItem.image_url && menuItem.image_url.trim()) {
        insertData.image_url = menuItem.image_url;
      }
      
      const { data, error } = await supabase
        .from('menu_items')
        .insert([insertData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase Create Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Successfully created menu item in Supabase:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating menu item:', error);
      throw error;
    }
  },

  async update(id, menuItem) {
    try {
      console.log('🔄 Updating menu item in Supabase:', { id, menuItem });
      
      const updateData = {
        name: menuItem.name,
        price: menuItem.price,
        category: menuItem.category || 'ทั่วไป',
        description: menuItem.description || ''
      };
      
      // Add optional fields only if they exist
      if (menuItem.cost !== undefined) {
        updateData.cost = menuItem.cost || 0;
      }
      
      if (menuItem.available !== undefined) {
        updateData.available = menuItem.available;
      }
      
      // Only add image_url if it exists and is not empty
      if (menuItem.image_url && menuItem.image_url.trim()) {
        updateData.image_url = menuItem.image_url;
      }
      
      console.log('📝 Updating menu item with data:', updateData);
      
      const { data, error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase Update Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Successfully updated menu item in Supabase:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating menu item:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      console.log('🔄 Deleting menu item from Supabase:', id);
      
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Supabase Delete Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Successfully deleted menu item from Supabase:', id);
    } catch (error) {
      console.error('❌ Error deleting menu item:', error);
      throw error;
    }
  }
};

// ================================
// PROMOTIONS FUNCTIONS
// ================================

export const promotionsAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw error;
    }
  },

  async create(promotion) {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .insert([{
          name: promotion.name,
          type: promotion.type,
          value: promotion.value,
          description: promotion.description,
          min_amount: promotion.minAmount || null,
          active: promotion.active,
          start_date: promotion.startDate,
          end_date: promotion.endDate
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  },

  async update(id, promotion) {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .update({
          name: promotion.name,
          type: promotion.type,
          value: promotion.value,
          description: promotion.description,
          min_amount: promotion.minAmount || null,
          active: promotion.active,
          start_date: promotion.startDate,
          end_date: promotion.endDate
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }
  }
};

// ================================
// ORDERS FUNCTIONS
// ================================

export const ordersAPI = {
  async getRecent(limit = 50) {
    try {
      console.log('🔄 Attempting to fetch recent orders from Supabase...');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.warn('⚠️ Supabase orders not available, using mock data:', error.message);
        
        // Return mock orders if Supabase fails
        const mockOrders = [
          {
            id: 1,
            items: [
              { name: 'กาแฟดำ', price: 45, quantity: 2 },
              { name: 'ขนมปัง', price: 25, quantity: 1 }
            ],
            subtotal: 115,
            total: 115,
            created_at: new Date().toISOString(),
            status: 'completed'
          },
          {
            id: 2,
            items: [
              { name: 'ข้าวผัดกุ้ง', price: 120, quantity: 1 }
            ],
            subtotal: 120,
            total: 120,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            status: 'completed'
          },
          {
            id: 3,
            items: [
              { name: 'สมิตา', price: 60, quantity: 2 },
              { name: 'ชาเย็น', price: 35, quantity: 1 }
            ],
            subtotal: 155,
            total: 155,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            status: 'completed'
          }
        ];
        
        return mockOrders;
      }
      
      console.log('✅ Successfully fetched', data?.length || 0, 'orders from Supabase');
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching recent orders:', error);
      return [];
    }
  },

  async create(order) {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          subtotal: order.subtotal,
          discount: order.discount,
          total: order.total,
          promotion_id: order.appliedPromotion?.id || null,
          promotion_name: order.appliedPromotion?.name || null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      if (order.items && order.items.length > 0) {
        const orderItems = order.items.map(item => ({
          order_id: orderData.id,
          menu_item_id: item.id,
          menu_item_name: item.name,
          menu_item_price: item.price,
          menu_item_cost: item.cost || 0,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          total_cost: (item.cost || 0) * item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      return orderData;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
};

// ================================
// UTILITY FUNCTIONS
// ================================

export const utilsAPI = {
  async testConnection() {
    try {
      console.log('🔄 Testing Supabase connection...');
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Connection test failed:', error);
        
        // ให้คำแนะนำตาม error
        let suggestion = '';
        if (error.code === 'PGRST116' || error.message?.includes('relation')) {
          suggestion = '🔧 ตาราง menu_items ไม่มีใน Database - รัน COMPLETE_DATABASE_SETUP.sql';
        } else if (error.code === '401' || error.message?.includes('JWT')) {
          suggestion = '🔧 API Key ไม่ถูกต้อง - ใช้ service_role key ใน supabase.js';
        } else {
          suggestion = '🔧 ตรวจสอบ URL และ API Key ใน supabase.js';
        }
        
        return { 
          success: false, 
          message: `${error.message}`, 
          suggestion: suggestion,
          errorCode: error.code 
        };
      }
      
      console.log('✅ Connection test successful');
      return { 
        success: true, 
        message: 'เชื่อมต่อ Supabase สำเร็จ',
        data: data 
      };
    } catch (error) {
      console.error('❌ Connection test error:', error);
      return { 
        success: false, 
        message: error.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ',
        suggestion: '🔧 ตรวจสอบการเชื่อมต่อ Internet และ Supabase URL'
      };
    }
  }
};

export default supabase;
