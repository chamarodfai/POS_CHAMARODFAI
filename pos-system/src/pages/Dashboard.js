import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { th } from 'date-fns/locale';
import './Dashboard.css';

function Dashboard() {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
    const { start, end } = getDateRange(selectedDate, selectedPeriod);
    const { start: prevStart, end: prevEnd } = getPreviousDateRange(selectedDate, selectedPeriod);
    
    const currentOrders = state.orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= start && orderDate <= end;
    });

    const previousOrders = state.orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= prevStart && orderDate <= prevEnd;
    });

    const currentRevenue = currentOrders.reduce((sum, order) => sum + order.total, 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    
    const currentDiscount = currentOrders.reduce((sum, order) => sum + order.discount, 0);
    const previousDiscount = previousOrders.reduce((sum, order) => sum + order.discount, 0);

    const revenueChange = previousRevenue === 0 ? 0 : ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    const orderChange = previousOrders.length === 0 ? 0 : ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100;

    // รายการขายดี
    const itemSales = {};
    currentOrders.forEach(order => {
      order.items.forEach(item => {
        if (itemSales[item.id]) {
          itemSales[item.id].quantity += item.quantity;
          itemSales[item.id].revenue += item.price * item.quantity;
        } else {
          itemSales[item.id] = {
            name: item.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
            price: item.price
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
      order.items.forEach(item => {
        const menuItem = state.menuItems.find(m => m.id === item.id);
        const category = menuItem ? menuItem.category : 'ไม่ระบุ';
        
        if (categoryStats[category]) {
          categoryStats[category].quantity += item.quantity;
          categoryStats[category].revenue += item.price * item.quantity;
        } else {
          categoryStats[category] = {
            quantity: item.quantity,
            revenue: item.price * item.quantity
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
  }, [state.orders, state.menuItems, selectedDate, selectedPeriod]);

  const formatPeriodLabel = () => {
    const date = new Date(selectedDate);
    
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
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 10)
              .map(order => (
                <div key={order.id} className="table-row">
                  <div>{format(new Date(order.timestamp), 'HH:mm')}</div>
                  <div>
                    {order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                  </div>
                  <div>฿{order.subtotal}</div>
                  <div>฿{order.discount}</div>
                  <div className="total">฿{order.total}</div>
                </div>
              ))}
          </div>
        ) : (
          <div className="no-data">ไม่มีออเดอร์ในช่วงเวลานี้</div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
