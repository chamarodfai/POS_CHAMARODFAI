import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SimpleAppProvider } from './context/SimpleAppContext2';
import Navigation from './components/Navigation';
import SimpleOrderPage from './pages/SimpleOrderPage';
import MenuManagement from './pages/MenuManagement';
import PromotionManagement from './pages/PromotionManagement';
import Dashboard from './pages/Dashboard';
import TestContextPage from './components/TestContextPage';
import DatabaseTest from './components/DatabaseTest';
import DataComparisonTest from './components/DataComparisonTest';
import SupabaseTestPage from './components/SupabaseTestPage';
import SimpleTest from './components/SimpleTest';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <SimpleAppProvider>
        <Router>
          <div className="App">
            {/* <SupabaseStatus /> */}
            {/* <ConnectionStatus /> */}
            <Navigation />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<SimpleOrderPage />} />
                <Route path="/order" element={<SimpleOrderPage />} />
                <Route path="/menu" element={<MenuManagement />} />
                <Route path="/promotions" element={<PromotionManagement />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/test" element={<SimpleTest />} />
                <Route path="/supabase" element={<SupabaseTestPage />} />
                <Route path="/test-context" element={<TestContextPage />} />
                <Route path="/dbtest" element={<DatabaseTest />} />
                <Route path="/compare" element={<DataComparisonTest />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SimpleAppProvider>
    </ErrorBoundary>
  );
}

export default App;
