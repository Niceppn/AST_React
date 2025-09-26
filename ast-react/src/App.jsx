import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from 'react-router-dom';
import Layout from "./Components/Layout";
import Login from "./Components/Login";
import MyRoute from "./MyRoute";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically import Bootstrap JS
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
    
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('👤 User loaded from localStorage:', userData);
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    console.log('✅ User logged in:', userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    console.log('👋 User logged out');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <MyRoute />
      </Layout>
    </Router>
  );
}

export default App;
