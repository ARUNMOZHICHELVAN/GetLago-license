import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  const isAuthenticated = async () => {
    if (!token) return false;

    try {
      const response = await axios.post('http://localhost:3000/verify-token', { token });
      if (response.data.isValid) {
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  };

  const [authenticated, setAuthenticated] =useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await isAuthenticated();
      setAuthenticated(isValid);
    };

    checkAuth();
  }, []);

  if (authenticated === null) {
    return <div>Loading...</div>; 
  }

  return (
    authenticated ? <Outlet /> : <Navigate to='/login' />
  );
}
