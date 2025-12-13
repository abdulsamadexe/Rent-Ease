import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EquipmentDetail from './pages/EquipmentDetail';

function App() {
  const [user, setUser] = useState(null);

  // Check if user is already logged in (persisted in local storage)
  useEffect(() => {
    const saved = localStorage.getItem('user');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />
      <div className="p-4 max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/equipment/:id" element={<EquipmentDetail user={user} />} />
          {/* Protect the dashboard route */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;