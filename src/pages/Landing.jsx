import { useNavigate } from 'react-router-dom'
import { SignInButton, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'

export default function Landing() {
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isSignedIn) navigate('/chat')
  }, [isSignedIn])

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col relative overflow-hidden">

      {/* decorative circle */}
      <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-gold-500 opacity-5 blur-3xl" />

      {/* navbar */}
      <nav className="flex justify-between items-center px-10 py-6 relative z-10">
        <span className="font-display text-2xl text-gold-400 tracking-wide">NyayAI</span>
        <SignInButton mode="modal">
          <button className="border border-gold-400 text-gold-400 px-6 py-2 text-sm hover:bg-gold-400 hover:text-navy-950 transition-all duration-300">
            Sign In
          </button>
        </SignInButton>
      </nav>

      {/* hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10">
        <p className="text-gold-400 text-sm tracking-[0.3em] uppercase mb-6">
          Indian Legal Intelligence
        </p>
        <h1 className="font-display text-6xl md:text-8xl text-white mb-6 leading-tight">
          Find the law.<br />
          <span className="text-gold-400">Understand it.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10 font-light">
          Search thousands of Indian court judgments using natural language.
          Powered by semantic AI — not just keywords.
        </p>
        <SignInButton mode="modal">
          <button className="bg-gold-400 text-navy-950 px-10 py-4 font-semibold text-lg hover:bg-gold-500 transition-all duration-300">
            Start Searching →
          </button>
        </SignInButton>

        {/* stats */}
        <div className="flex gap-16 mt-20 text-center">
          {[
            { value: '100+', label: 'Court Judgments' },
            { value: 'AI', label: 'Semantic Search' },
            { value: '100%', label: 'Free to Use' }
          ].map(stat => (
            <div key={stat.label}>
              <div className="font-display text-3xl text-gold-400">{stat.value}</div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div className="text-center py-6 text-gray-600 text-sm relative z-10">
        Built on Indian Kanoon data · Powered by RAG
      </div>
    </div>
  )
}