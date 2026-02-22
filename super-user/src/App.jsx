import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard        from './pages/Dashboard';
import BranchManagement from './pages/BranchManagement';
import AdminControl     from './pages/AdminControl';
import SystemLogs       from './pages/SystemLogs';
import GlobalSettings   from './pages/GlobalSettings';

function App() {
  return (
    <Router>
      <div className="super-layout">
        <Sidebar />
        <main className="super-main">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/branches"  element={<BranchManagement />} />
            <Route path="/admins"    element={<AdminControl />} />
            <Route path="/logs"      element={<SystemLogs />} />
            <Route path="/settings"  element={<GlobalSettings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
