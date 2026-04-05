import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import Navbar from '../components/Navbar'
import CaseCard from '../components/CaseCard'
import { setAuthToken } from '../services/api'

export default function Dashboard() {
  const { getToken } = useAuth()
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([]) // {role, content, sources}
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim() || loading) return

    const userMessage = { role: 'user', content: query }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setQuery('')
    setLoading(true)

    try {
      const token = await getToken()
      setAuthToken(token)

      const response = await fetch(`${import.meta.env.VITE_API_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          history: messages // send full history
        })
      })

      const sourcesHeader = response.headers.get('X-Sources')
      const sources = sourcesHeader ? JSON.parse(sourcesHeader) : []

      // add empty assistant message to stream into
      setMessages(prev => [...prev, { role: 'assistant', content: '', sources }])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk
          }
          return updated
        })
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        sources: []
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => setMessages([])

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col">

        {/* empty state */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">⚖️</div>
            <h2 className="font-display text-3xl text-white mb-3">Ask anything about Indian law</h2>
            <p className="text-gray-600 mb-8">Search cases, understand judgments, ask follow-ups</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                'GST fraud provisional attachment',
                'Cheque bounce High Court judgment',
                'Property dispute Delhi',
                'Bail conditions Supreme Court'
              ].map(s => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); }}
                  className="border border-navy-600 text-gray-400 text-sm px-4 py-2 hover:border-gold-400 hover:text-gold-400 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* chat messages */}
        {messages.length > 0 && (
          <div className="flex-1 space-y-6 mb-6 overflow-y-auto">

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (

                  // user bubble
                  <div className="bg-navy-700 border border-navy-600 px-5 py-3 max-w-xl">
                    <p className="text-white">{msg.content}</p>
                  </div>

                ) : (

                  // assistant response
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-gold-400 rounded-full" />
                      <span className="text-gold-400 text-xs tracking-widest uppercase">NyayAI</span>
                    </div>

                    {/* answer */}
                    <div className="bg-navy-800 border border-navy-600 p-6 mb-3">
                      {msg.content ? (
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                          <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                          <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                        </div>
                      )}
                    </div>

                    {/* sources */}
                    {msg.sources?.length > 0 && (
                      <div>
                        <p className="text-gray-600 text-xs uppercase tracking-widest mb-2">Source Judgments</p>
                        <div className="space-y-2">
                          {msg.sources.map(c => <CaseCard key={c.caseId} case={c} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* loading indicator for new message */}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-1 pl-2">
                <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
              </div>
            )}
          </div>
        )}

        {/* input bar — always at bottom */}
        <div className="border-t border-navy-700 pt-4">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-gray-600 text-xs hover:text-gray-400 transition-colors mb-3"
            >
              + New conversation
            </button>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Ask about Indian case law..."
              className="flex-1 bg-navy-800 border border-navy-600 text-white px-5 py-4 focus:outline-none focus:border-gold-400 transition-colors placeholder-gray-600"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="bg-gold-400 text-navy-950 px-8 py-4 font-semibold hover:bg-gold-500 transition-all disabled:opacity-50"
            >
              {loading ? '...' : 'Ask'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// import { useState, useRef } from 'react'
// import { useAuth } from '@clerk/clerk-react'
// import { useNavigate } from 'react-router-dom'
// import Navbar from '../components/Navbar'
// import CaseCard from '../components/CaseCard'
// import { setAuthToken } from '../services/api'

// export default function Dashboard() {
//   const { getToken } = useAuth()
//   const [query, setQuery] = useState('')
//   const [answer, setAnswer] = useState('')
//   const [sources, setSources] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [searched, setSearched] = useState(false)
//   const answerRef = useRef('')

//   const handleSearch = async () => {
//     if (!query.trim()) return
//     setLoading(true)
//     setAnswer('')
//     setSources([])
//     answerRef.current = ''
//     setSearched(true)

//     try {
//       const token = await getToken()
//       setAuthToken(token)

//       const response = await fetch(`${import.meta.env.VITE_API_URL}/search`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ query })
//       })

//       // parse sources from header
//       const sourcesHeader = response.headers.get('X-Sources')
//       if (sourcesHeader) setSources(JSON.parse(sourcesHeader))

//       // stream the answer
//       const reader = response.body.getReader()
//       const decoder = new TextDecoder()

//       while (true) {
//         const { done, value } = await reader.read()
//         if (done) break
//         const chunk = decoder.decode(value)
//         answerRef.current += chunk
//         setAnswer(prev => prev + chunk)
//       }

//     } catch (err) {
//       setAnswer('Something went wrong. Please try again.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-navy-950">
//       <Navbar />
//       <div className="max-w-4xl mx-auto px-6 py-12">

//         {/* search header */}
//         <div className="text-center mb-12">
//           <h1 className="font-display text-4xl text-white mb-3">
//             Search Indian Case Law
//           </h1>
//           <p className="text-gray-500">Ask in plain English — our AI finds the relevant judgments</p>
//         </div>

//         {/* search bar */}
//         <div className="flex gap-3 mb-12">
//           <input
//             type="text"
//             value={query}
//             onChange={e => setQuery(e.target.value)}
//             onKeyDown={e => e.key === 'Enter' && handleSearch()}
//             placeholder="e.g. GST fraud provisional attachment Supreme Court..."
//             className="flex-1 bg-navy-800 border border-navy-600 text-white px-5 py-4 focus:outline-none focus:border-gold-400 transition-colors placeholder-gray-600"
//           />
//           <button
//             onClick={handleSearch}
//             disabled={loading}
//             className="bg-gold-400 text-navy-950 px-8 py-4 font-semibold hover:bg-gold-500 transition-all disabled:opacity-50"
//           >
//             {loading ? '...' : 'Search'}
//           </button>
//         </div>

//         {/* results */}
//         {searched && (
//           <div className="space-y-8">

//             {/* streaming answer */}
//             <div className="bg-navy-800 border border-navy-600 p-8">
//               <div className="flex items-center gap-2 mb-4">
//                 <div className="w-2 h-2 bg-gold-400 rounded-full" />
//                 <span className="text-gold-400 text-sm tracking-widest uppercase">AI Analysis</span>
//               </div>
//               {loading && !answer && (
//                 <div className="flex gap-1">
//                   <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
//                   <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
//                   <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
//                 </div>
//               )}
//               <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{answer}</p>
//             </div>

//             {/* source cases */}
//             {sources.length > 0 && (
//               <div>
//                 <h2 className="font-display text-xl text-white mb-4">Source Judgments</h2>
//                 <div className="space-y-3">
//                   {sources.map(c => <CaseCard key={c.caseId} case={c} />)}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* empty state */}
//         {!searched && (
//           <div className="text-center py-20">
//             <div className="text-6xl mb-4">⚖️</div>
//             <p className="text-gray-600">Try searching for "cheque bounce High Court" or "property dispute Delhi"</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }