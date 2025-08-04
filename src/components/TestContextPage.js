import React from 'react';
import { useSimpleApp } from '../context/SimpleAppContext2';

function TestContextPage() {
  const { state, addToOrder } = useSimpleApp();
  
  const handleTestAddOrder = () => {
    if (state.menuItems.length > 0) {
      addToOrder(state.menuItems[0]);
      console.log('Added first menu item to order');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Test Context Page</h2>
      
      <div>
        <h3>State:</h3>
        <p>Menu Items: {state.menuItems?.length || 0}</p>
        <p>Promotions: {state.promotions?.length || 0}</p>
        <p>Orders: {state.orders?.length || 0}</p>
        <p>Current Order Items: {state.currentOrder?.items?.length || 0}</p>
        <p>Loading Menu: {state.loading?.menuItems ? 'Yes' : 'No'}</p>
        <p>Loading Promotions: {state.loading?.promotions ? 'Yes' : 'No'}</p>
        <p>Supabase Connected: {state.supabaseConnected ? 'Yes' : 'No'}</p>
      </div>
      
      <div>
        <h3>Functions Test:</h3>
        <button onClick={handleTestAddOrder}>
          Add First Menu Item to Order
        </button>
      </div>
      
      <div>
        <h3>Menu Items:</h3>
        {state.menuItems?.map(item => (
          <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
            <strong>{item.name}</strong> - ฿{item.price}
          </div>
        ))}
      </div>
      
      <div>
        <h3>Current Order:</h3>
        {state.currentOrder?.items?.map(item => (
          <div key={item.id} style={{ border: '1px solid #green', padding: '10px', margin: '5px' }}>
            {item.name} x {item.quantity} = ฿{item.price * item.quantity}
          </div>
        ))}
        <p><strong>Total: ฿{state.currentOrder?.total || 0}</strong></p>
      </div>
    </div>
  );
}

export default TestContextPage;
