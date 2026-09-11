import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import CreateVoucher from './pages/CreateVoucher';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [navigationOpen, setNavigationOpen] = useState(false);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isSuperUser = user && (
    user.role === 'superuser' || 
    user.Role === 'superuser' || 
    user.role === 'admin' || 
    user.Role === 'admin' || 
    user.login_name === 'su' || 
    user.LoginName === 'su' || 
    user.FocusUserID === 1
  );

  return (
    <BrowserRouter>
      <div className="app-shell flex h-screen overflow-hidden text-slate-900 font-sans">
        {user && (
          <Sidebar
            user={user}
            onLogout={handleLogout}
            isOpen={navigationOpen}
            onClose={() => setNavigationOpen(false)}
          />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {user && <Header user={user} onMenuClick={() => setNavigationOpen(true)} />}

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route 
                path="/login" 
                element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
              />
              
              <Route 
                path="/" 
                element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
              />
              
              <Route 
                path="/create-voucher" 
                element={user ? <CreateVoucher user={user} /> : <Navigate to="/login" />} 
              />
              
              <Route 
                path="/admin" 
                element={
                  user && isSuperUser
                    ? <Admin user={user} /> 
                    : <Navigate to="/" />
                } 
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
