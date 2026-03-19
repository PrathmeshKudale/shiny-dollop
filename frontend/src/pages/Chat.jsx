import { useState, useRef, useEffect } from 'react'
import { chatService } from '../services/services'
import { useAuthStore } from '../store/authStore'
import { Send, Loader2, MessageCircle, Trash2, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const SUGGESTED_PROMPTS = [
  'How much did I spend last month?',
  'Which category am I overspending in?',
  'What were my top 3 expenses this week?',
  'How can I save more money?',
  'Show me my spending trend',
  'Am I on track with my budget?',
]

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)
  const { user }                = useAuthStore()

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user', content: trimmed, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Build history for context (last 10 messages, excluding the one just added)
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const { reply } = await chatService.query(trimmed, history)

      const aiMsg = { role: 'assistant', content: reply, id: Date.now() + 1 }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      toast.error('Failed to get AI response')
      // Remove the user message on error so they can retry
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
      setInput(trimmed)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const copyMessage = (content, id) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const clearChat = () => {
    if (messages.length === 0) return
    if (confirm('Clear conversation?')) setMessages([])
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-cyan/10 border border-accent-cyan/25 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-accent-cyan" />
          </div>
          <div>
            <h1 className="text-white font-semibold">AI Finance Assistant</h1>
            <p className="text-xs text-white/40">Powered by GPT-4o · Knows your spending data</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn-ghost flex items-center gap-2 text-xs px-3 py-2">
            <Trash2 className="w-3.5 h-3.5" /> Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-accent-cyan" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">Ask me anything about your finances</h2>
            <p className="text-white/40 text-sm mb-8 max-w-sm">
              I have access to your real spending data and can answer questions, spot trends, and help you save more.
            </p>
            {/* Suggested prompts */}
            <div className="grid grid-cols-2 gap-2 max-w-xl w-full">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm text-white/60 bg-bg-secondary hover:bg-bg-tertiary border border-white/[0.08] hover:border-accent-cyan/30 rounded-xl px-4 py-3 transition-all duration-150"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              msg.role === 'user'
                ? 'bg-accent-purple/20 border border-accent-purple/30 text-accent-purple'
                : 'bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan'
            }`}>
              {msg.role === 'user' ? user?.name?.[0]?.toUpperCase() || 'U' : '✦'}
            </div>

            {/* Bubble */}
            <div className={`group relative max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent-green/10 border border-accent-green/20 text-white rounded-tr-sm'
                  : 'bg-bg-secondary border border-white/[0.08] text-white/80 rounded-tl-sm'
              }`}>
                {/* Render message with basic markdown-like formatting */}
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={line === '' ? 'h-2' : ''}>
                    {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </p>
                ))}
              </div>
              {/* Copy button */}
              <button
                onClick={() => copyMessage(msg.content, msg.id)}
                className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center bg-bg-card border border-white/10 rounded-lg transition-all"
              >
                {copiedId === msg.id
                  ? <Check className="w-3 h-3 text-accent-green" />
                  : <Copy className="w-3 h-3 text-white/40" />
                }
              </button>
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-xs text-accent-cyan flex-shrink-0">
              ✦
            </div>
            <div className="bg-bg-secondary border border-white/[0.08] rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-accent-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-accent-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-accent-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-8 pb-6 pt-3 border-t border-white/[0.06] flex-shrink-0">
        {/* Suggested chips (show after first message) */}
        {messages.length > 0 && messages.length < 3 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-xs text-white/50 bg-bg-secondary border border-white/[0.08] hover:border-accent-cyan/30 rounded-full px-3 py-1.5 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your spending, budgets, savings…"
            rows={1}
            className="input flex-1 resize-none py-3 max-h-32 overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-white/20 mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
