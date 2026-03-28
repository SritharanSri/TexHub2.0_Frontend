import { useState, useRef, useEffect } from 'react'
import { generateDesigns, EXAMPLE_PROMPTS } from '../../services/aiService'

const LoadingDot = ({ delay }) => (
  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: delay }} />
)

const Sparkle = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
)

export default function AIDesignGenerator({ category, onSelect, selectedId }) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])  // { role: 'user'|'ai', text?, images?, error?, loading? }
  const [inputLoading, setInputLoading] = useState(false)
  const examples = EXAMPLE_PROMPTS[category] || EXAMPLE_PROMPTS.man
  const textRef = useRef(null)
  const chatEndRef = useRef(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleGenerate = async (overridePrompt) => {
    const text = (overridePrompt || prompt).trim()
    if (!text || inputLoading) return

    setPrompt('')
    setInputLoading(true)

    // Add user bubble + loading AI bubble
    const userMsg = { role: 'user', text }
    const loadingMsg = { role: 'ai', loading: true }
    setMessages(prev => [...prev, userMsg, loadingMsg])

    try {
      const data = await generateDesigns(text)
      setMessages(prev => [
        ...prev.slice(0, -1),  // remove loading bubble
        { role: 'ai', images: data.images, prompt: text },
      ])
    } catch (e) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'ai', error: e.message },
      ])
    } finally {
      setInputLoading(false)
      textRef.current?.focus()
    }
  }

  const handleRetry = async (promptText) => {
    if (inputLoading) return
    setInputLoading(true)
    const loadingMsg = { role: 'ai', loading: true }
    setMessages(prev => [...prev, loadingMsg])
    try {
      const data = await generateDesigns(promptText)
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'ai', images: data.images, prompt: promptText },
      ])
    } catch (e) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'ai', error: e.message },
      ])
    } finally {
      setInputLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 480 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900">AI Design Studio</h3>
          <p className="text-gray-400 text-xs">Describe your outfit — AI will generate it</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs font-semibold">Puter.js AI</span>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 rounded-3xl border border-gray-100 bg-gray-50/50 overflow-y-auto p-4 space-y-4 mb-4" style={{ maxHeight: 420 }}>

        {/* Empty state / example prompts */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4 text-purple-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.813-6.843m-4.764 4.648l-6.843 3.813m-2.196-2.196l-3.813-6.843M12 12c-1.396.963-3.08-1.517-1.517-3.08l4.417-1.325" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold mb-1">What would you like to create?</p>
            <p className="text-gray-400 text-sm mb-5">Type a description or try an example below</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {examples.map((ex, i) => (
                <button key={i} onClick={() => handleGenerate(ex)}
                  className="group flex items-center gap-2 text-sm bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 text-gray-600 hover:text-purple-700 rounded-2xl px-4 py-2 transition-all duration-150 shadow-sm">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={idx} className="flex justify-end">
                <div className="max-w-xs bg-gray-900 text-white rounded-3xl rounded-br-lg px-4 py-3 shadow-sm">
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            )
          }

          // AI bubble
          return (
            <div key={idx} className="flex justify-start">
              <div className="flex gap-2.5 max-w-full w-full">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow">
                  <Sparkle />
                  <span className="sr-only">AI</span>
                </div>

                <div className="flex-1">
                  {/* Loading */}
                  {msg.loading && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-bl-lg px-5 py-4 shadow-sm inline-flex items-center gap-2">
                      <div className="flex gap-1">
                        <LoadingDot delay="0ms" />
                        <LoadingDot delay="150ms" />
                        <LoadingDot delay="300ms" />
                      </div>
                      <span className="text-sm text-gray-500 font-medium">Generating designs…</span>
                    </div>
                  )}

                  {/* Error */}
                  {msg.error && (
                    <div className="bg-white border border-red-200 rounded-3xl rounded-bl-lg px-5 py-4 shadow-sm">
                      <div className="flex items-start gap-2 text-red-600">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold">Generation failed</p>
                          <p className="text-xs text-red-500 mt-0.5">{msg.error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image results */}
                  {msg.images && (
                    <div className="bg-white border border-gray-100 rounded-3xl rounded-bl-lg px-4 py-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {msg.images.length} design{msg.images.length !== 1 ? 's' : ''} generated
                        </p>
                        <button
                          onClick={() => handleRetry(msg.prompt)}
                          disabled={inputLoading}
                          className="text-xs text-purple-600 font-semibold hover:underline disabled:opacity-40"
                        >
                          ↻ Regenerate
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {msg.images.map(img => {
                          const isChosen = selectedId === img.id
                          return (
                            <button key={img.id} onClick={() => onSelect(img)}
                              className={`relative rounded-2xl overflow-hidden transition-all duration-200 focus:outline-none ${
                                isChosen
                                  ? 'ring-4 ring-purple-600 ring-offset-2 scale-[1.03]'
                                  : 'hover:scale-[1.02] hover:shadow-lg'
                              }`}>
                              <img
                                src={img.url}
                                alt={img.label}
                                className="w-full aspect-[3/4] object-cover"
                                onError={e => { e.target.src = `https://picsum.photos/seed/${img.id}/400/500` }}
                              />
                              {isChosen && (
                                <div className="absolute inset-0 bg-purple-900/30 flex items-center justify-center">
                                  <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center shadow-xl">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                <p className="text-white text-xs font-semibold">{img.label}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      {selectedId && msg.images.some(i => i.id === selectedId) && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Design selected! Continue to the next step.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div ref={chatEndRef} />
      </div>

      {/* Quick examples strip (shown after first message) */}
      {messages.length > 0 && !inputLoading && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {examples.map((ex, i) => (
            <button key={i} onClick={() => handleGenerate(ex)}
              className="flex-shrink-0 text-xs bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 text-gray-500 hover:text-purple-700 rounded-full px-3 py-1.5 transition-all duration-150">
              {ex.slice(0, 28)}…
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl blur-lg" />
        <div className="relative flex items-end gap-3 bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 shadow-sm focus-within:border-purple-400 transition-colors">
          <textarea
            ref={textRef}
            rows={1}
            value={prompt}
            onChange={e => {
              setPrompt(e.target.value)
              // Auto-grow
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate() }
            }}
            placeholder="Describe your ideal outfit… (Enter to send)"
            disabled={inputLoading}
            className="flex-1 resize-none outline-none text-gray-800 placeholder-gray-300 text-sm leading-relaxed bg-transparent disabled:opacity-50"
            style={{ maxHeight: 120, overflowY: 'auto' }}
          />
          <button
            onClick={() => handleGenerate()}
            disabled={inputLoading || !prompt.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-900 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow"
          >
            {inputLoading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-300 mt-1.5 ml-1">Powered by Puter.js · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
