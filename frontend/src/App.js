import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import './App.css';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'inventory' && <Inventory />}
      </main>
    </div>
  );
}
