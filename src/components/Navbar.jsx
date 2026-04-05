import { UserButton } from '@clerk/clerk-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="border-b border-navy-700 px-10 py-4 flex justify-between items-center">
      <span
        onClick={() => navigate('/dashboard')}
        className="font-display text-xl text-gold-400 cursor-pointer"
      >
        NyayAI
      </span>
      <div className="flex items-center gap-8">
        <button
          onClick={() => navigate('/dashboard')}
          className={`text-sm transition-colors ${location.pathname === '/dashboard' ? 'text-gold-400' : 'text-gray-500 hover:text-white'}`}
        >
          Search
        </button>
        <button
          onClick={() => navigate('/history')}
          className={`text-sm transition-colors ${location.pathname === '/history' ? 'text-gold-400' : 'text-gray-500 hover:text-white'}`}
        >
          History
        </button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  )
}