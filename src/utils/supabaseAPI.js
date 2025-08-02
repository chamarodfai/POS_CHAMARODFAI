import supabase, { handleSupabaseError, testConnection } from '../config/supabase';

// ================================
// MENU ITEMS FUNCTIONS
// ================================

export const menuItemsAPI = {
  // ดึงเมนูทั้งหมด
  async getAll() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // ดึงเมนูที่พร้อมจำหน่าย
  async getAvailable() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // เพิ่มเมนูใหม่
  async create(menuItem) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([{
        name: menuItem.name,
        price: menuItem.price,
        cost: menuItem.cost || 0,
        category: menuItem.category,
        description: menuItem.description,
        image_url: menuItem.image,
        available: menuItem.available
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // อัปเดตเมนู
  async update(id, menuItem) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({
        name: menuItem.name,
        price: menuItem.price,
        cost: menuItem.cost || 0,
        category: menuItem.category,
        description: menuItem.description,
        image_url: menuItem.image,
        available: menuItem.available
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ลบเมนู
  async delete(id) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ================================
// PROMOTIONS FUNCTIONS
// ================================

export const promotionsAPI = {
  // ดึงโปรโมชั่นทั้งหมด
  async getAll() {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // ดึงโปรโมชั่นที่ใช้งานได้
  async getActive() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // เพิ่มโปรโมชั่นใหม่
  async create(promotion) {
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
  },

  // อัปเดตโปรโมชั่น
  async update(id, promotion) {
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
  },

  // ลบโปรโมชั่น
  async delete(id) {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ================================
// ORDERS FUNCTIONS
// ================================

export const ordersAPI = {
  // ดึงออเดอร์ทั้งหมด
  async getAll(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('order_time', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching orders:', error);
        // ถ้า error เป็นเรื่อง RLS หรือ permissions ให้ return array ว่าง
        if (error.code === 'PGRST301' || error.message.includes('insufficient')) {
          console.warn('Orders access restricted, returning empty array');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Orders API error:', error);
      return []; // fallback to empty array
    }
  },

  // ดึงออเดอร์ตามช่วงวันที่
  async getByDateRange(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .order('order_time', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders by date range:', error);
        if (error.code === 'PGRST301' || error.message.includes('insufficient')) {
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Orders by date range API error:', error);
      return [];
    }
  },

  // สร้างออเดอร์ใหม่
  async create(order) {
    // เริ่ม transaction
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        promotion_id: order.appliedPromotion?.id || null,
        promotion_name: order.appliedPromotion?.name || null,
        order_date: new Date().toISOString().split('T')[0],
        order_time: new Date().toISOString()
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // เพิ่มรายการสินค้า
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

    return orderData;
  }
};

// ================================
// DASHBOARD/STATS FUNCTIONS
// ================================

export const statsAPI = {
  // ดึงสถิติรายวัน
  async getDailyStats(date = new Date().toISOString().split('T')[0]) {
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('stat_date', date)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // ดึงสถิติตามช่วงวันที่
  async getStatsByDateRange(startDate, endDate) {
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('stat_date', startDate)
      .lte('stat_date', endDate)
      .order('stat_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // ดึงรายการขายดี
  async getTopSellingItems(daysBack = 7, limit = 5) {
    const { data, error } = await supabase
      .rpc('get_top_selling_items', {
        days_back: daysBack,
        limit_count: limit
      });
    
    if (error) throw error;
    return data;
  },

  // ดึงยอดขายตามหมวดหมู่
  async getSalesByCategory(startDate, endDate) {
    const { data, error } = await supabase
      .rpc('get_sales_by_category', {
        start_date: startDate,
        end_date: endDate
      });
    
    if (error) throw error;
    return data;
  },

  // อัปเดตสถิติรายวัน
  async updateDailyStats(date = new Date().toISOString().split('T')[0]) {
    const { error } = await supabase
      .rpc('update_daily_stats', {
        target_date: date
      });
    
    if (error) throw error;
  },

  // ดึงสถิติแบบสรุป
  async getSummaryStats(startDate, endDate) {
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('stat_date', startDate)
      .lte('stat_date', endDate)
      .order('stat_date', { ascending: true });
    
    if (error) throw error;

    if (data.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        totalDiscount: 0,
        netProfit: 0,
        avgOrderValue: 0,
        profitMargin: 0
      };
    }

    const totalOrders = data.reduce((sum, stat) => sum + stat.total_orders, 0);
    const totalRevenue = data.reduce((sum, stat) => sum + parseFloat(stat.total_revenue), 0);
    const totalCost = data.reduce((sum, stat) => sum + parseFloat(stat.total_cost), 0);
    const grossProfit = data.reduce((sum, stat) => sum + parseFloat(stat.gross_profit), 0);
    const totalDiscount = data.reduce((sum, stat) => sum + parseFloat(stat.total_discount), 0);
    const netProfit = data.reduce((sum, stat) => sum + parseFloat(stat.net_profit), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalOrders,
      totalRevenue,
      totalCost,
      grossProfit,
      totalDiscount,
      netProfit,
      avgOrderValue,
      profitMargin,
      dailyStats: data
    };
  },

  // วิเคราะห์กำไร
  async getProfitAnalysis(startDate, endDate) {
    const { data, error } = await supabase
      .rpc('get_profit_analysis', {
        start_date: startDate,
        end_date: endDate
      });
    
    if (error) throw error;
    return data[0] || null;
  },

  // เมนูที่ให้กำไรมากที่สุด
  async getMostProfitableItems(daysBack = 7, limitCount = 10) {
    const { data, error } = await supabase
      .rpc('get_most_profitable_items', {
        days_back: daysBack,
        limit_count: limitCount
      });
    
    if (error) throw error;
    return data;
  },

  // กำไรตามหมวดหมู่
  async getProfitByCategory(startDate, endDate) {
    const { data, error } = await supabase
      .rpc('get_sales_by_category', {
        start_date: startDate,
        end_date: endDate
      });
    
    if (error) throw error;
    return data;
  }
};

// ================================
// CATEGORIES FUNCTIONS
// ================================

export const categoriesAPI = {
  // ดึงหมวดหมู่ทั้งหมด
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // เพิ่มหมวดหมู่ใหม่
  async create(category) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: category.name,
        description: category.description
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ================================
// UTILITY FUNCTIONS
// ================================

export const utilsAPI = {
  // ทดสอบการเชื่อมต่อ
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return { success: true, message: 'เชื่อมต่อ Supabase สำเร็จ' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // สร้างข้อมูลตัวอย่าง
  async seedData() {
    try {
      // ตรวจสอบว่ามีข้อมูลแล้วหรือไม่
      const { data: existingItems } = await supabase
        .from('menu_items')
        .select('id')
        .limit(1);

      if (existingItems && existingItems.length > 0) {
        return { success: false, message: 'มีข้อมูลในระบบแล้ว' };
      }

      // เพิ่มข้อมูลตัวอย่าง
      await menuItemsAPI.create({
        name: 'ข้าวผัดกุ้ง',
        price: 80,
        category: 'อาหารจานเดียว',
        description: 'ข้าวผัดกุ้งสดใส่ไข่',
        image: '',
        available: true
      });

      await promotionsAPI.create({
        name: 'ลด 10%',
        type: 'percentage',
        value: 10,
        description: 'ลดราคา 10% สำหรับทุกรายการ',
        active: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      return { success: true, message: 'สร้างข้อมูลตัวอย่างสำเร็จ' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

export default supabase;
