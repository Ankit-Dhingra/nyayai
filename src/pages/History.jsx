import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import Navbar from '../components/Navbar'
import { setAuthToken } from '../services/api'
import api from '../services/api'

export default function History() {
  const { getToken } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await getToken()
        setAuthToken(token)
        const res = await api.get('/history')
        setHistory(res.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-display text-4xl text-white mb-8">Search History</h1>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            No searches yet. Go search something.
          </div>
        )}

        <div className="space-y-4">
          {history.map(item => (
            <div key={item._id} className="bg-navy-800 border border-navy-600 overflow-hidden">

              {/* header row — always visible */}
              <div
                className="flex justify-between items-center p-6 cursor-pointer hover:bg-navy-700 transition-colors"
                onClick={() => setExpanded(expanded === item._id ? null : item._id)}
              >
                <div>
                  <p className="text-white font-medium mb-1">{item.query}</p>
                  <div className="flex gap-4">
                    <span className="text-gray-500 text-sm">{item.results.length} cases found</span>
                    <span className="text-gray-600 text-sm">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <span className={`text-gold-400 text-xl transition-transform duration-300 ${expanded === item._id ? 'rotate-180' : ''}`}>
                  ↓
                </span>
              </div>

              {/* expanded — source cases */}
              {expanded === item._id && (
                <div className="border-t border-navy-600 px-6 pb-6 pt-4">
                  <p className="text-gray-500 text-sm mb-3 uppercase tracking-widest">Source Cases</p>
                  <div className="space-y-3">
                    {item.results.map(c => (
                      <a
                        key={c.caseId}
                        href={`https://indiankanoon.org/doc/${c.caseId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex justify-between items-center bg-navy-900 border border-navy-700 hover:border-gold-400 p-4 transition-all group"
                      >
                        <div>
                          <p className="text-white text-sm group-hover:text-gold-400 transition-colors">{c.title}</p>
                          <div className="flex gap-3 mt-1">
                            {c.court && <span className="text-gray-600 text-xs">{c.court}</span>}
                            {c.date && <span className="text-gray-600 text-xs">{c.date}</span>}
                          </div>
                        </div>
                        <span className="text-gold-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}