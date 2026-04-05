import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Landing from './pages/Landing'
import ChatLayout from './pages/ChatLayout'

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return isSignedIn ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<ProtectedRoute><ChatLayout /></ProtectedRoute>} />
        <Route path="/chat/:sessionId" element={<ProtectedRoute><ChatLayout /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}