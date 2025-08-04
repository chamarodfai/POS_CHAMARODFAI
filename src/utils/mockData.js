// ================================
// MOCK DATA สำหรับ FALLBACK MODE
// ใช้เมื่อเชื่อมต่อ Supabase ไม่ได้
// ================================

export const mockMenuItems = [
  {
    id: 'mock-1',
    name: 'กาแฟดำ',
    price: 45,
    cost: 25,
    category: 'เครื่องดื่ม',
    description: 'กาแฟดำข้นหอมกรุ่น',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300',
    available: true
  },
  {
    id: 'mock-2',
    name: 'ข้าวผัดกุ้ง',
    price: 120,
    cost: 70,
    category: 'อาหารจานหลัก',
    description: 'ข้าวผัดกุ้งสดใหญ่',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300',
    available: true
  },
  {
    id: 'mock-3',
    name: 'สมิตา',
    price: 60,
    cost: 35,
    category: 'เครื่องดื่ม',
    description: 'สมิตาเย็นๆ สดชื่น',
    image_url: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=300',
    available: true
  }
];

export const mockPromotions = [
  {
    id: 'promo-1',
    name: 'ลด 10%',
    description: 'ลดราคา 10% เมื่อซื้อครบ 200 บาท',
    type: 'percentage',
    value: 10,
    min_amount: 200,
    active: true
  },
  {
    id: 'promo-2',
    name: 'ลด 50 บาท',
    description: 'ลดราคา 50 บาท เมื่อซื้อครบ 300 บาท',
    type: 'fixed',
    value: 50,
    min_amount: 300,
    active: true
  }
];

export const mockOrders = [];

// Mock API Functions
export const mockAPI = {
  menuItems: {
    async getAll() {
      console.log('🔄 Using Mock Data for menu items');
      return mockMenuItems;
    },
    async getAvailable() {
      console.log('🔄 Using Mock Data for available menu items');
      return mockMenuItems.filter(item => item.available);
    }
  },
  
  promotions: {
    async getAll() {
      console.log('🔄 Using Mock Data for promotions');
      return mockPromotions;
    },
    async getActive() {
      console.log('🔄 Using Mock Data for active promotions');
      return mockPromotions.filter(promo => promo.active);
    }
  },
  
  orders: {
    async getAll() {
      console.log('🔄 Using Mock Data for orders');
      return mockOrders;
    },
    async create(orderData) {
      console.log('🔄 Mock Order Creation:', orderData);
      const newOrder = {
        id: `mock-order-${Date.now()}`,
        ...orderData,
        created_at: new Date().toISOString()
      };
      mockOrders.push(newOrder);
      return newOrder;
    }
  },
  
  utils: {
    async testConnection() {
      return {
        success: false,
        message: 'ใช้ Mock Data Mode',
        suggestion: '🔧 รัน COMPLETE_DATABASE_SETUP.sql เพื่อเชื่อมต่อ Database จริง'
      };
    }
  }
};
