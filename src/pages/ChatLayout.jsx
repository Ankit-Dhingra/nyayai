import { useState, useEffect, useRef } from "react";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useParams, useNavigate } from "react-router-dom";
import CaseCard from "../components/CaseCard";
import api, { setAuthToken } from "../services/api";
import ReactMarkdown from "react-markdown";

export default function ChatLayout() {
  const { getToken } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId || null);
  const currentSessionIdRef = useRef(sessionId || null); // add this
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // fetch sidebar sessions
  const fetchSessions = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const res = await api.get("/sessions");
      setSessions(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // load session messages when sessionId changes
  const loadSession = async (id) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const res = await api.get(`/sessions/${id}`);
      setMessages(res.data.data.messages);
      setCurrentSessionId(id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessions();
    if (sessionId) loadSession(sessionId);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    navigate("/chat");
  };

  const handleSessionClick = (id) => {
    navigate(`/chat/${id}`);
    loadSession(id);
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    const token = await getToken();
    setAuthToken(token);
    await api.delete(`/sessions/${id}`);
    setSessions((prev) => prev.filter((s) => s._id !== id));
    if (currentSessionId === id) handleNewChat();
  };

  const handleSearch = async () => {
    if (!query.trim() || loading) return;

    const userMsg = { role: "user", content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setQuery("");
    setLoading(true);

    try {
      const token = await getToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // to this
        body: JSON.stringify({
          query,
          history: messages,
          sessionId: currentSessionIdRef.current, // new
        }),
      });

      // after getting response, check if it's a 400 JSON error
      if (!response.ok) {
        const err = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: err.message,
            sources: [],
          },
        ]);
        setLoading(false);
        return;
      }

      const sourcesHeader = response.headers.get("X-Sources");
      const sources = sourcesHeader ? JSON.parse(sourcesHeader) : [];

      const newSessionId = response.headers.get("X-Session-Id");
      if (newSessionId && !currentSessionIdRef.current) {
        // new — only on first message
        currentSessionIdRef.current = newSessionId;
        setCurrentSessionId(newSessionId);
        navigate(`/chat/${newSessionId}`, { replace: true });
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", sources },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }

      fetchSessions();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // group sessions by date
  const groupSessions = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = { Today: [], Yesterday: [], Earlier: [] };

    sessions.forEach((s) => {
      const d = new Date(s.createdAt);
      if (d.toDateString() === today.toDateString()) groups.Today.push(s);
      else if (d.toDateString() === yesterday.toDateString())
        groups.Yesterday.push(s);
      else groups.Earlier.push(s);
    });

    return groups;
  };

  const groups = groupSessions();

  return (
    <div className="h-screen bg-navy-950 flex overflow-hidden">
      {/* sidebar */}
      <div
        className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 border-r border-navy-700 flex flex-col overflow-hidden`}
      >
        {/* sidebar header */}
        <div className="p-4 border-b border-navy-700">
          <div className="flex items-center justify-between mb-4">
            <span className="font-display text-xl text-gold-400">NyayAI</span>
            <UserButton afterSignOutUrl="/" />
          </div>
          <button
            onClick={handleNewChat}
            className="w-full border border-navy-600 hover:border-gold-400 text-gray-400 hover:text-gold-400 py-2 text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>+</span> New Conversation
          </button>
        </div>

        {/* session list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {Object.entries(groups).map(
            ([label, items]) =>
              items.length > 0 && (
                <div key={label}>
                  <p className="text-gray-600 text-xs uppercase tracking-widest px-2 mb-2">
                    {label}
                  </p>
                  {items.map((s) => (
                    <div
                      key={s._id}
                      onClick={() => handleSessionClick(s._id)}
                      className={`group flex items-center justify-between px-3 py-2 cursor-pointer rounded transition-all ${
                        currentSessionId === s._id
                          ? "bg-navy-700 text-gold-400"
                          : "text-gray-400 hover:bg-navy-800 hover:text-white"
                      }`}
                    >
                      <span className="text-sm truncate flex-1">{s.title}</span>
                      <button
                        onClick={(e) => handleDeleteSession(e, s._id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 ml-2 text-xs transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ),
          )}
        </div>
      </div>

      {/* main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* top bar */}
        <div className="border-b border-navy-700 px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-white transition-colors text-lg"
          >
            ☰
          </button>
          <span className="text-gray-600 text-sm">
            {currentSessionId
              ? sessions.find((s) => s._id === currentSessionId)?.title ||
                "Conversation"
              : "New Conversation"}
          </span>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">⚖️</div>
              <h2 className="font-display text-3xl text-white mb-3">
                Ask anything about Indian law
              </h2>
              <p className="text-gray-600 mb-8">
                Search cases, understand judgments, ask follow-ups
              </p>
              <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                {[
                  "GST fraud provisional attachment",
                  "Cheque bounce High Court judgment",
                  "Property dispute Delhi",
                  "Bail conditions Supreme Court",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="border border-navy-600 text-gray-400 text-sm px-4 py-2 hover:border-gold-400 hover:text-gold-400 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-navy-700 border border-navy-600 px-5 py-3 max-w-xl">
                      <p className="text-white">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-gold-400 rounded-full" />
                      <span className="text-gold-400 text-xs tracking-widest uppercase">
                        NyayAI
                      </span>
                    </div>
                    <div className="bg-navy-800 border border-navy-600 p-6 mb-3">
                      {msg.content ? (
                        <ReactMarkdown
                          className="text-gray-300 leading-relaxed space-y-3"
                          components={{
                            strong: ({ children }) => (
                              <span className="text-gold-400 font-semibold">
                                {children}
                              </span>
                            ),
                            p: ({ children }) => (
                              <p className="mb-3">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 space-y-1">
                                {children}
                              </ul>
                            ),
                            li: ({ children }) => (
                              <li className="text-gray-300">{children}</li>
                            ),
                            h1: ({ children }) => (
                              <h1 className="font-display text-xl text-white mb-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="font-display text-lg text-white mb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-gold-400 font-semibold mb-1">
                                {children}
                              </h3>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      )}
                    </div>
                    {msg.sources?.length > 0 && (
                      <div>
                        <p className="text-gray-600 text-xs uppercase tracking-widest mb-2">
                          Source Judgments
                        </p>
                        <div className="space-y-2">
                          {msg.sources.map((c) => (
                            <CaseCard key={c.caseId} case={c} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* input */}
        <div className="border-t border-navy-700 px-6 py-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ask about Indian case law..."
              className="flex-1 bg-navy-800 border border-navy-600 text-white px-5 py-4 focus:outline-none focus:border-gold-400 transition-colors placeholder-gray-600"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="bg-gold-400 text-navy-950 px-8 py-4 font-semibold hover:bg-gold-500 transition-all disabled:opacity-50"
            >
              {loading ? "..." : "Ask"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
