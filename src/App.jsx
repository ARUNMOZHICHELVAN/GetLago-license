import './App.css'
import CustomerForm from './components/CustomerForm'
import dotenv from 'dotenv';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Notfound from './components/Notfound'
import CustomerList from './components/customerList'
import Login from './components/Login'
import Signup from './components/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './components/ForgotPassword';



function App() {
  
  return (
    <Router>
      <Routes>


        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />} >
          <Route path="/" element={<CustomerForm />} />
          <Route path="/customers" element={<CustomerList />} />
        </ Route>
        
        <Route path="*" element={<Notfound />} />
      </Routes>
    </Router>
  )
}

export default App
