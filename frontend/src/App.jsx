import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/HomeUser"
import AdminHome from "./pages/AdminHome"
import CookDashboard from "./pages/CookDashboard";
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"

function Logout() {
  localStorage.clear()
  return <Navigate to="/login" />
}

function RegisterAndLogout() {
  localStorage.clear()
  return <Register />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["ученик", "student"]}>
              <Home />
            </ProtectedRoute>
          }
        />
        
        {/* Страница администратора */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["администратор", "admin"]}>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        
        {/* Страница повара */}
        <Route
          path="/cook"
          element={
            <ProtectedRoute allowedRoles={["повар", "cook"]}>
              <CookDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App