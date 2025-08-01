import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/SupabaseAppContext';
import Navigation from './components/Navigation';
import OrderPage from './pages/OrderPage';
import MenuManagement from './pages/MenuManagement';
import PromotionManagement from './pages/PromotionManagement';
import Dashboard from './pages/Dashboard';
import ConnectionStatus from './components/ConnectionStatus';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <ConnectionStatus />
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<OrderPage />} />
              <Route path="/menu" element={<MenuManagement />} />
              <Route path="/promotions" element={<PromotionManagement />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
