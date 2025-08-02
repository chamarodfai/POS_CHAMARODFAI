import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SimpleAppProvider } from './context/SimpleAppContext';
import Navigation from './components/Navigation';
import OrderPage from './pages/OrderPage';
import MenuManagement from './pages/MenuManagement';
import PromotionManagement from './pages/PromotionManagement';
import Dashboard from './pages/Dashboard';
import ConnectionStatus from './components/ConnectionStatus';
import SupabaseStatus from './components/SupabaseStatus';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <SimpleAppProvider>
        <Router>
          <div className="App">
            <SupabaseStatus />
            <ConnectionStatus />
            <Navigation />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<ErrorBoundary><OrderPage /></ErrorBoundary>} />
                <Route path="/menu" element={<ErrorBoundary><MenuManagement /></ErrorBoundary>} />
                <Route path="/promotions" element={<ErrorBoundary><PromotionManagement /></ErrorBoundary>} />
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              </Routes>
            </main>
          </div>
        </Router>
      </SimpleAppProvider>
    </ErrorBoundary>
  );
}

export default App;
