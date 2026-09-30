import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { ChangePasswordPage } from './pages/ChangePasswordPage.tsx'
import { ProtectedRoute } from './components/guards/ProtectedRoute.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/change-password" 
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="*" 
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
