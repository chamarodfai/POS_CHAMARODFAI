-- =======================================
-- SIMPLE POS DATABASE FOR SUPABASE
-- ฐานข้อมูล POS แบบเรียบง่าย เข้ากันได้กับ Supabase
-- =======================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SELECT '🚀 Creating Simple POS Database Schema...' as status;

-- ลบตารางเก่าทั้งหมดก่อน (ถ้ามี) - ตามลำดับ dependency
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ======================================
-- 1. CATEGORIES TABLE
-- ======================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 2. MENU_ITEMS TABLE  
-- ======================================
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    category VARCHAR(100) NOT NULL,
    image_url TEXT DEFAULT '',
    available BOOLEAN DEFAULT true,
    
    -- Analytics fields
    total_sold INTEGER DEFAULT 0,
    last_sold_at TIMESTAMP WITH TIME ZONE,
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    low_stock_alert INTEGER DEFAULT 5,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE
);

-- ======================================
-- 3. PROMOTIONS TABLE
-- ======================================
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0,
    
    start_date DATE,
    end_date DATE,
    
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER,
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 4. ORDERS TABLE
-- ======================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    promotion_id UUID,
    promotion_name VARCHAR(200),
    
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    
    order_date DATE DEFAULT CURRENT_DATE,
    order_time TIME DEFAULT CURRENT_TIME,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (promotion_id) REFERENCES promotions(id)
);

-- ======================================
-- 5. ORDER_ITEMS TABLE
-- ======================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    
    menu_item_id UUID,
    menu_item_name VARCHAR(200) NOT NULL,
    menu_item_price DECIMAL(10,2) NOT NULL,
    menu_item_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- ======================================
-- 6. DAILY_STATS TABLE
-- ======================================
CREATE TABLE daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    total_profit DECIMAL(12,2) DEFAULT 0,
    total_items_sold INTEGER DEFAULT 0,
    
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    unique_customers INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT '✅ Tables created successfully!' as step1;

-- ======================================
-- 7. FUNCTIONS
-- ======================================

-- ลบ functions เก่าก่อน (ถ้ามี) - ใช้ DROP SCHEMA CASCADE เพื่อลบทุกอย่าง
DO $$ 
DECLARE 
    func_name TEXT;
BEGIN
    -- ลบ functions ที่มีชื่อซ้ำทั้งหมด
    FOR func_name IN 
        SELECT format('%I.%I(%s)', 
                      n.nspname, 
                      p.proname, 
                      pg_get_function_identity_arguments(p.oid))
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname IN ('update_updated_at_column', 'generate_order_number', 'get_top_selling_items', 'auto_generate_order_number')
        AND n.nspname = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_name || ' CASCADE';
    END LOOP;
END $$;

-- Function สำหรับอัพเดต updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function สำหรับสร้างหมายเลขออเดอร์
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    today_date TEXT;
    order_count INTEGER;
    order_number TEXT;
BEGIN
    today_date := to_char(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COUNT(*) + 1 INTO order_count
    FROM orders 
    WHERE order_date = CURRENT_DATE;
    
    order_number := 'ORD' || today_date || LPAD(order_count::TEXT, 4, '0');
    
    RETURN order_number;
END;
$$ language 'plpgsql';

-- Function สำหรับดึงสินค้าขายดี
CREATE OR REPLACE FUNCTION get_top_selling_items(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    menu_item_id UUID,
    menu_item_name VARCHAR(200),
    total_quantity INTEGER,
    total_revenue DECIMAL(12,2),
    total_profit DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.menu_item_id,
        oi.menu_item_name,
        SUM(oi.quantity)::INTEGER as total_quantity,
        SUM(oi.subtotal) as total_revenue,
        SUM(oi.subtotal - oi.total_cost) as total_profit
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'cancelled'
    GROUP BY oi.menu_item_id, oi.menu_item_name
    ORDER BY total_quantity DESC
    LIMIT limit_count;
END;
$$ language 'plpgsql';

SELECT '✅ Functions created successfully!' as step2;

-- ======================================
-- 8. TRIGGERS
-- ======================================

-- ลบ triggers เก่าก่อน (ถ้ามี)
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON daily_stats;
DROP TRIGGER IF EXISTS auto_order_number_trigger ON orders;

-- Triggers สำหรับ updated_at
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON menu_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at 
    BEFORE UPDATE ON promotions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at 
    BEFORE UPDATE ON daily_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger สำหรับสร้างหมายเลขออเดอร์
CREATE OR REPLACE FUNCTION auto_generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION auto_generate_order_number();

SELECT '✅ Triggers created successfully!' as step3;

-- ======================================
-- 9. VIEWS สำหรับ Analytics
-- ======================================

-- ลบ views เก่าก่อน (ถ้ามี)
DROP VIEW IF EXISTS order_details;
DROP VIEW IF EXISTS menu_analytics;
DROP VIEW IF EXISTS category_sales;

-- View รายละเอียดออเดอร์
CREATE OR REPLACE VIEW order_details AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.order_date,
    o.order_time,
    o.customer_name,
    o.customer_phone,
    o.subtotal,
    o.discount,
    o.total,
    o.status,
    o.payment_method,
    oi.menu_item_name,
    oi.menu_item_price,
    oi.menu_item_cost,
    oi.quantity,
    oi.subtotal as item_subtotal,
    oi.total_cost as item_total_cost,
    (oi.subtotal - oi.total_cost) as item_profit
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
ORDER BY o.created_at DESC;

-- View วิเคราะห์เมนู
CREATE OR REPLACE VIEW menu_analytics AS
SELECT 
    mi.id,
    mi.name,
    mi.category,
    mi.price,
    mi.cost,
    mi.stock_quantity,
    mi.total_sold,
    mi.available,
    CASE 
        WHEN mi.price > 0 THEN ((mi.price - mi.cost) / mi.price) * 100
        ELSE 0 
    END as profit_margin_percent,
    CASE
        WHEN mi.stock_quantity <= mi.low_stock_alert THEN 'LOW'
        WHEN mi.stock_quantity = 0 THEN 'OUT'
        ELSE 'OK'
    END as stock_status
FROM menu_items mi;

-- View ยอดขายรายหมวด
CREATE OR REPLACE VIEW category_sales AS
SELECT 
    mi.category,
    COUNT(DISTINCT mi.id) as total_items,
    COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(oi.subtotal), 0) as total_revenue,
    COALESCE(SUM(oi.total_cost), 0) as total_cost,
    COALESCE(SUM(oi.subtotal - oi.total_cost), 0) as total_profit
FROM menu_items mi
LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
GROUP BY mi.category
ORDER BY total_revenue DESC;

SELECT '✅ Views created successfully!' as step4;

-- ======================================
-- 10. INDEXES
-- ======================================

-- ลบ indexes เก่าก่อน (ถ้ามี)
DROP INDEX IF EXISTS idx_menu_items_category;
DROP INDEX IF EXISTS idx_menu_items_available;
DROP INDEX IF EXISTS idx_menu_items_name;
DROP INDEX IF EXISTS idx_orders_date;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_customer_phone;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_menu_item_id;
DROP INDEX IF EXISTS idx_promotions_active;
DROP INDEX IF EXISTS idx_daily_stats_date;

-- Basic indexes
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(available);
CREATE INDEX idx_menu_items_name ON menu_items(name);

CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

CREATE INDEX idx_promotions_active ON promotions(active);
CREATE INDEX idx_daily_stats_date ON daily_stats(date);

SELECT '✅ Indexes created successfully!' as step5;

-- ======================================
-- 11. ROW LEVEL SECURITY
-- ======================================

-- Basic RLS policies
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on menu_items" ON menu_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on promotions" ON promotions FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on daily_stats" ON daily_stats FOR ALL USING (true);

SELECT '✅ Security policies created successfully!' as step6;

-- ======================================
-- 12. INITIAL DATA
-- ======================================

-- เพิ่มหมวดหมู่
INSERT INTO categories (name, description) VALUES
('ก๋วยเตี๋ยว', 'เมนูก๋วยเตี๋ยวทุกชนิด'),
('ข้าว', 'เมนูข้าวทุกประเภท'),
('ผัด', 'เมนูผัดต่างๆ'),
('ส้มตำ', 'เมนูส้มตำและอาหารอีสาน'),
('เครื่องดื่ม', 'เครื่องดื่มทุกชนิด'),
('ของหวาน', 'ขนมและของหวาน');

-- เพิ่มเมนูตัวอย่าง
INSERT INTO menu_items (name, price, cost, category, description, image_url, stock_quantity, available) VALUES
-- ก๋วยเตี๋ยว
('ก๋วยเตี๋ยวหมูน้ำใส', 45.00, 30.00, 'ก๋วยเตี๋ยว', 'ก๋วยเตี๋ยวหมูน้ำใส เส้นเล็ก หมูสด ผักกาดขาว', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300', 50, true),
('ก๋วยเตี๋ยวหมูน้ำตก', 50.00, 35.00, 'ก๋วยเตี๋ยว', 'ก๋วยเตี๋ยวหมูน้ำตก เส้นใหญ่ หมูแดง เครื่องในหมู', 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300', 50, true),
('ก๋วยเตี๋ยวต้มยำ', 55.00, 40.00, 'ก๋วยเตี๋ยว', 'ก๋วยเตี๋ยวต้มยำกุ้ง เส้นเล็ก กุ้งสด รสเปรี้ยวเผ็ด', 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=300', 30, true),

-- ข้าว
('ข้าวผัดหมู', 50.00, 35.00, 'ข้าว', 'ข้าวผัดหมูใส่ไข่ ผักคะน้า หอมหัวใหญ่', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300', 40, true),
('ข้าวผัดไก่', 45.00, 30.00, 'ข้าว', 'ข้าวผัดไก่ใส่ไข่ ผักคะน้า แครอท', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300', 40, true),
('ข้าวผัดกุ้ง', 60.00, 45.00, 'ข้าว', 'ข้าวผัดกุ้งสด ใส่ไข่ ผักรวม', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300', 25, true),

-- ผัด
('ผัดไทย', 55.00, 40.00, 'ผัด', 'ผัดไทยกุ้งสด เส้นจันทร์ ถั่วงอก กุ้งแห้ง', 'https://images.unsplash.com/photo-1559314809-0f31657b3dfd?w=300', 35, true),
('ผัดกะเพราหมู', 45.00, 30.00, 'ผัด', 'ผัดกะเพราหมูสับ ใส่ไข่ดาว รสจัดจ้าน', 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=300', 45, true),

-- ส้มตำ
('ส้มตำไทย', 40.00, 25.00, 'ส้มตำ', 'ส้มตำไทย มะละกอสด กุ้งแห้ง ถั่วลิสง', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300', 30, true),
('ลาบหมู', 50.00, 35.00, 'ส้มตำ', 'ลาบหมูสับ เครื่องเทศอีสาน ข้าวเหนียว', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300', 25, true),

-- เครื่องดื่ม
('น้ำเปล่า', 10.00, 5.00, 'เครื่องดื่ม', 'น้ำเปล่า 500ml', 'https://images.unsplash.com/photo-1550073753-9707143671b3?w=300', 100, true),
('โค้ก', 15.00, 8.00, 'เครื่องดื่ม', 'โคคา-โคล่า 325ml', 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=300', 80, true),
('ชาเย็น', 25.00, 15.00, 'เครื่องดื่ม', 'ชาเย็นหวาน นมข้นหวาน', 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=300', 50, true),

-- ของหวาน
('ไอศกรีมวนิลลา', 35.00, 20.00, 'ของหวาน', 'ไอศกรีมวนิลลาเย็นฉ่ำ', 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=300', 20, true),
('ขนมโตรทปิ้ง', 30.00, 15.00, 'ของหวาน', 'ขนมโตรทปิ้งหน้าช็อกโกแลต', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=300', 25, true);

-- เพิ่มโปรโมชั่น
INSERT INTO promotions (name, description, type, value, min_amount, active, start_date, end_date) VALUES
('ลด 10% เมื่อสั่งครบ 200 บาท', 'รับส่วนลด 10% เมื่อสั่งอาหารครบ 200 บาท', 'percentage', 10.00, 200.00, true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('ลด 50 บาท เมื่อสั่งครบ 500 บาท', 'รับส่วนลด 50 บาท เมื่อสั่งอาหารครบ 500 บาท', 'fixed', 50.00, 500.00, true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- สร้างข้อมูล daily_stats สำหรับวันนี้
INSERT INTO daily_stats (date, total_orders, total_revenue, total_items_sold) VALUES
(CURRENT_DATE, 0, 0.00, 0);

SELECT '✅ Initial data inserted successfully!' as step7;

-- ======================================
-- 13. FINAL VERIFICATION
-- ======================================

-- ตรวจสอบการสร้างตาราง
SELECT 
    '📊 Database Summary' as summary_type,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as total_views,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') as total_functions;

-- ตรวจสอบข้อมูลเริ่มต้น
SELECT 
    '📈 Data Summary' as data_summary,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM menu_items) as menu_items_count,
    (SELECT COUNT(*) FROM menu_items WHERE available = true) as available_items,
    (SELECT COUNT(*) FROM promotions) as promotions_count;

-- ทดสอบ Analytics
SELECT 'Top 5 Best Sellers:' as demo_type;
SELECT * FROM get_top_selling_items(5);

-- Final success message
SELECT 
    '🎯 SUCCESS: Simple POS Database Created!' as final_status,
    'Database is ready for Web App!' as ready_status;
