import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/SupabaseAppContext';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { th } from 'date-fns/locale';
import './Dashboard.css';

function Dashboard() {
  const { state, loadRecentOrders } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // โหลดข้อมูลออเดอร์เมื่อเข้าหน้า (แค่ครั้งเดียว)
  useEffect(() => {
    loadRecentOrders(100); // โหลดออเดอร์ล่าสุด 100 รายการ
  }, []); // ลบ dependency เพื่อให้รันแค่ครั้งเดียว

  const periods = [
    { key: 'daily', label: 'รายวัน' },
    { key: 'weekly', label: 'รายสัปดาห์' },
    { key: 'monthly', label: 'รายเดือน' },
    { key: 'yearly', label: 'รายปี' }
  ];

  const getDateRange = (date, period) => {
    const selectedDate = new Date(date);
    
    switch (period) {
      case 'daily':
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate)
        };
      case 'weekly':
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        };
      case 'monthly':
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate)
        };
      case 'yearly':
        return {
          start: startOfYear(selectedDate),
          end: endOfYear(selectedDate)
        };
      default:
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate)
        };
    }
  };

  const getPreviousDateRange = (date, period) => {
    const selectedDate = new Date(date);
    
    switch (period) {
      case 'daily':
        const prevDay = subDays(selectedDate, 1);
        return {
          start: startOfDay(prevDay),
          end: endOfDay(prevDay)
        };
      case 'weekly':
        const prevWeek = subWeeks(selectedDate, 1);
        return {
          start: startOfWeek(prevWeek, { weekStartsOn: 1 }),
          end: endOfWeek(prevWeek, { weekStartsOn: 1 })
        };
      case 'monthly':
        const prevMonth = subMonths(selectedDate, 1);
        return {
          start: startOfMonth(prevMonth),
          end: endOfMonth(prevMonth)
        };
      case 'yearly':
        const prevYear = subYears(selectedDate, 1);
        return {
          start: startOfYear(prevYear),
          end: endOfYear(prevYear)
        };
      default:
        return {
          start: startOfDay(subDays(selectedDate, 1)),
          end: endOfDay(subDays(selectedDate, 1))
        };
    }
  };

  const salesData = useMemo(() => {
    try {
      const { start, end } = getDateRange(selectedDate, selectedPeriod);
      const { start: prevStart, end: prevEnd } = getPreviousDateRange(selectedDate, selectedPeriod);
      
      // ตรวจสอบว่า state.orders เป็น array หรือไม่
      const orders = Array.isArray(state.orders) ? state.orders : [];
      
      const currentOrders = orders.filter(order => {
        const orderDate = new Date(order.order_time || order.timestamp);
        return !isNaN(orderDate.getTime()) && orderDate >= start && orderDate <= end;
      });

      const previousOrders = orders.filter(order => {
        const orderDate = new Date(order.order_time || order.timestamp);
        return !isNaN(orderDate.getTime()) && orderDate >= prevStart && orderDate <= prevEnd;
      });

      const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      const currentDiscount = currentOrders.reduce((sum, order) => sum + (order.discount || 0), 0);
      const previousDiscount = previousOrders.reduce((sum, order) => sum + (order.discount || 0), 0);

      const revenueChange = previousRevenue === 0 ? 0 : ((currentRevenue - previousRevenue) / previousRevenue) * 100;
      const orderChange = previousOrders.length === 0 ? 0 : ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100;

    // รายการขายดี
    const itemSales = {};
    currentOrders.forEach(order => {
      const orderItems = order.order_items || order.items || [];
      orderItems.forEach(item => {
        const itemId = item.menu_item_id || item.id;
        const itemName = item.menu_item_name || item.name;
        const itemPrice = item.menu_item_price || item.price;
        const itemQuantity = item.quantity;
        
        if (itemSales[itemId]) {
          itemSales[itemId].quantity += itemQuantity;
          itemSales[itemId].revenue += itemPrice * itemQuantity;
        } else {
          itemSales[itemId] = {
            name: itemName,
            quantity: itemQuantity,
            revenue: itemPrice * itemQuantity,
            price: itemPrice
          };
        }
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // การวิเคราะห์ตามหมวดหมู่
    const categoryStats = {};
    currentOrders.forEach(order => {
      const orderItems = order.order_items || order.items || [];
      orderItems.forEach(item => {
        const itemId = item.menu_item_id || item.id;
        const itemName = item.menu_item_name || item.name;
        const itemPrice = item.menu_item_price || item.price;
        const itemQuantity = item.quantity;
        
        // หาหมวดหมู่จากเมนู
        const menuItem = state.menuItems.find(m => m.id === itemId);
        const category = menuItem ? menuItem.category : 'ไม่ระบุ';
        
        if (categoryStats[category]) {
          categoryStats[category].quantity += itemQuantity;
          categoryStats[category].revenue += itemPrice * itemQuantity;
        } else {
          categoryStats[category] = {
            quantity: itemQuantity,
            revenue: itemPrice * itemQuantity
          };
        }
      });
    });

    const categoryData = Object.entries(categoryStats).map(([category, data]) => ({
      category,
      ...data
    }));

      return {
        current: {
          revenue: currentRevenue,
          orders: currentOrders.length,
          discount: currentDiscount,
          averageOrder: currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0
        },
        previous: {
          revenue: previousRevenue,
          orders: previousOrders.length,
          discount: previousDiscount
        },
        changes: {
          revenue: revenueChange,
          orders: orderChange
        },
        topItems,
        categoryData,
        orders: currentOrders
      };
    } catch (error) {
      console.error('Error calculating sales data:', error);
      return {
        current: { revenue: 0, orders: 0, discount: 0, averageOrder: 0 },
        previous: { revenue: 0, orders: 0, discount: 0 },
        changes: { revenue: 0, orders: 0 },
        topItems: [],
        categoryData: [],
        orders: []
      };
    }
  }, [state.orders, state.menuItems, selectedDate, selectedPeriod]);

  const formatPeriodLabel = () => {
    const date = new Date(selectedDate);
    
    // ตรวจสอบว่า date valid หรือไม่
    if (isNaN(date.getTime())) {
      return 'ข้อมูลวันที่ไม่ถูกต้อง';
    }
    
    switch (selectedPeriod) {
      case 'daily':
        return format(date, 'dd MMMM yyyy', { locale: th });
      case 'weekly':
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return `${format(weekStart, 'dd MMM', { locale: th })} - ${format(weekEnd, 'dd MMM yyyy', { locale: th })}`;
      case 'monthly':
        return format(date, 'MMMM yyyy', { locale: th });
      case 'yearly':
        return format(date, 'yyyy', { locale: th });
      default:
        return '';
    }
  };

  const getChangeIcon = (change) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '➡️';
  };

  const getChangeClass = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="controls">
          <div className="period-selector">
            {periods.map(period => (
              <button
                key={period.key}
                className={`period-btn ${selectedPeriod === period.key ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period.key)}
              >
                {period.label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-picker"
          />
        </div>
      </div>

      <div className="period-info">
        <h2>{formatPeriodLabel()}</h2>
        {state.loading.orders && (
          <p style={{ color: '#666', fontSize: '14px' }}>กำลังโหลดข้อมูล...</p>
        )}
        {state.errors.orders && (
          <div style={{ color: '#e74c3c', fontSize: '14px' }}>
            <p>ข้อผิดพลาด: {state.errors.orders}</p>
            <button 
              onClick={() => loadRecentOrders(100)}
              style={{ 
                backgroundColor: '#3498db', 
                color: 'white', 
                border: 'none', 
                padding: '5px 10px', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ลองใหม่
            </button>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card revenue">
          <div className="stat-header">
            <h3>ยอดขาย</h3>
            <span className={`change-indicator ${getChangeClass(salesData.changes.revenue)}`}>
              {getChangeIcon(salesData.changes.revenue)} {Math.abs(salesData.changes.revenue).toFixed(1)}%
            </span>
          </div>
          <div className="stat-value">฿{salesData.current.revenue.toLocaleString()}</div>
          <div className="stat-comparison">
            เทียบกับช่วงก่อน: ฿{salesData.previous.revenue.toLocaleString()}
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-header">
            <h3>จำนวนออเดอร์</h3>
            <span className={`change-indicator ${getChangeClass(salesData.changes.orders)}`}>
              {getChangeIcon(salesData.changes.orders)} {Math.abs(salesData.changes.orders).toFixed(1)}%
            </span>
          </div>
          <div className="stat-value">{salesData.current.orders}</div>
          <div className="stat-comparison">
            เทียบกับช่วงก่อน: {salesData.previous.orders}
          </div>
        </div>

        <div className="stat-card average">
          <div className="stat-header">
            <h3>ยอดเฉลี่ยต่อออเดอร์</h3>
          </div>
          <div className="stat-value">฿{salesData.current.averageOrder.toFixed(0)}</div>
          <div className="stat-comparison">
            {salesData.current.orders > 0 ? 'คำนวณจากออเดอร์ปัจจุบัน' : 'ไม่มีข้อมูล'}
          </div>
        </div>

        <div className="stat-card discount">
          <div className="stat-header">
            <h3>ส่วนลดรวม</h3>
          </div>
          <div className="stat-value">฿{salesData.current.discount.toLocaleString()}</div>
          <div className="stat-comparison">
            เทียบกับช่วงก่อน: ฿{salesData.previous.discount.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>รายการขายดี (Top 5)</h3>
          {salesData.topItems.length > 0 ? (
            <div className="top-items">
              {salesData.topItems.map((item, index) => (
                <div key={index} className="top-item">
                  <div className="rank">#{index + 1}</div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-stats">
                      จำนวน: {item.quantity} | รายได้: ฿{item.revenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="item-bar">
                    <div 
                      className="bar-fill"
                      style={{ 
                        width: `${(item.quantity / salesData.topItems[0].quantity) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">ไม่มีข้อมูลการขาย</div>
          )}
        </div>

        <div className="chart-card">
          <h3>ยอดขายตามหมวดหมู่</h3>
          {salesData.categoryData.length > 0 ? (
            <div className="category-stats">
              {salesData.categoryData
                .sort((a, b) => b.revenue - a.revenue)
                .map((category, index) => (
                  <div key={index} className="category-item">
                    <div className="category-info">
                      <div className="category-name">{category.category}</div>
                      <div className="category-revenue">฿{category.revenue.toLocaleString()}</div>
                    </div>
                    <div className="category-bar">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${(category.revenue / Math.max(...salesData.categoryData.map(c => c.revenue))) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="no-data">ไม่มีข้อมูลการขาย</div>
          )}
        </div>
      </div>

      <div className="recent-orders">
        <h3>ออเดอร์ล่าสุด</h3>
        {salesData.orders.length > 0 ? (
          <div className="orders-table">
            <div className="table-header">
              <div>เวลา</div>
              <div>รายการ</div>
              <div>ยอดรวม</div>
              <div>ส่วนลด</div>
              <div>ยอดสุทธิ</div>
            </div>
            {salesData.orders
              .sort((a, b) => new Date(b.order_time || b.timestamp) - new Date(a.order_time || a.timestamp))
              .slice(0, 10)
              .map(order => {
                const orderTime = order.order_time || order.timestamp;
                const orderItems = order.order_items || order.items || [];
                const timeDisplay = orderTime ? format(new Date(orderTime), 'HH:mm') : '--:--';
                
                return (
                  <div key={order.id} className="table-row">
                    <div>{timeDisplay}</div>
                    <div>
                      {orderItems.map(item => 
                        `${item.menu_item_name || item.name} x${item.quantity}`
                      ).join(', ')}
                    </div>
                    <div>฿{order.subtotal || 0}</div>
                    <div>฿{order.discount || 0}</div>
                    <div className="total">฿{order.total || 0}</div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="no-data">ไม่มีออเดอร์ในช่วงเวลานี้</div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
