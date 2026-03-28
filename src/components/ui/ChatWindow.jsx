import { useState, useEffect, useRef } from 'react'
import { Send, Image as ImageIcon, X, CheckCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { chatService } from '../../services/chatService'
import { socketService } from '../../services/socket'

// Safe time formatter — never throws on bad dates
const safeTime = (val) => {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function ChatWindow({ orderId, recipientName, recipientRole, onClose, receiverId }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState('')
  const [isConnected, setIsConnected] = useState(socketService.socket?.connected || false)
  const messagesEndRef = useRef(null)

  const myUserId = user?.id || null
  const isDemo = !!user?._demo

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Map a backend message object to UI shape — safe, never throws
  const mapMsg = (msg) => ({
    id: msg.id || String(Date.now() + Math.random()),
    text: msg.content || '',
    senderId: msg.senderId,
    isMe: msg.senderId === myUserId,
    time: safeTime(msg.createdAt),
  })

  // Initial fetch and Socket setup
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!isDemo) {
          const res = await chatService.getMessages(orderId)
          if (res?.success && Array.isArray(res.data)) {
            setMessages(res.data.map(mapMsg))
          }
        } else {
          // Demo mode mock
          setMessages(prev => prev.length > 0 ? prev : [
            { id: 1, text: "Hi! I've accepted your bid. When can I expect the first fitting?", isMe: user?.role === 'customer', time: '10:00 AM' },
            { id: 2, text: "Hello! Thank you. I will start the cutting today. First fitting can be scheduled for next Tuesday.", isMe: user?.role === 'tailor', time: '10:15 AM' },
          ])
        }
      } catch (err) {
        console.error('Failed to fetch messages', err)
        const msg = err?.response?.data?.message || 'Failed to load chat history'
        setChatError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Socket Initialization
    if (!isDemo && user?.token) {
      socketService.connect(user.token)
      socketService.joinOrderChat(orderId)

      const handleNewMessage = (msg) => {
        // Safe update with duplicate check
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, mapMsg(msg)]
        })
      }

      const handleConnect = () => setIsConnected(true)
      const handleDisconnect = () => setIsConnected(false)

      socketService.socket?.on('connect', handleConnect)
      socketService.socket?.on('disconnect', handleDisconnect)
      socketService.onNewMessage(handleNewMessage)

      return () => {
        socketService.leaveOrderChat(orderId)
        socketService.socket?.off('connect', handleConnect)
        socketService.socket?.off('disconnect', handleDisconnect)
        socketService.offNewMessage(handleNewMessage)
      }
    }
  }, [orderId, myUserId, isDemo, user?.token])

  // Scroll to bottom when messages update
  useEffect(() => {
    if (!loading) scrollToBottom()
  }, [messages, loading])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    setChatError('')

    if (isDemo) {
      const newMessage = {
        id: Date.now(),
        text: input,
        isMe: true,
        time: safeTime(new Date()),
      }
      setMessages(prev => [...prev, newMessage])
      setInput('')
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: `(Auto-reply from ${recipientName}) Thanks for your message!`,
          isMe: false,
          time: safeTime(new Date()),
        }])
      }, 2000)
      return
    }

    setSending(true)
    const currentInput = input
    setInput('')
    try {
      const res = await chatService.sendMessage(orderId, currentInput, receiverId)
      const newMsg = res?.data || res
      // Safely add the sent message — handle any response shape
      setMessages(prev => [...prev, {
        id: newMsg?.id || Date.now(),
        text: newMsg?.content || currentInput,
        senderId: newMsg?.senderId || myUserId,
        isMe: true,
        time: safeTime(newMsg?.createdAt) || safeTime(new Date()),
      }])
      scrollToBottom()
    } catch (err) {
      console.error('Failed to send message', err)
      setInput(currentInput)
      const errMsg = err?.response?.data?.message || 'Failed to send message. Please try again.'
      setChatError(errMsg)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold backdrop-blur-sm border border-white/30">
            {recipientName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">{recipientName || 'User'}</h3>
            <div className="flex items-center gap-1.5 capitalize">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse ring-2 ring-emerald-400/30' : 'border border-white/40'}`} />
              <p className="text-white/70 text-[10px] font-medium">{recipientRole} · {isConnected ? 'Live' : 'Offline'}</p>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        <div className="text-center">
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
            Today
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-sm text-gray-400">
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                msg.isMe
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${msg.isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                  {msg.time && <span className="text-[10px]">{msg.time}</span>}
                  {msg.isMe && <CheckCheck className="w-3 h-3" />}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Error Banner */}
      {chatError && (
        <div className="mx-3 mb-1 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
          <span>⚠️</span> {chatError}
          <button onClick={() => setChatError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button type="button" className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors flex-shrink-0">
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 rounded-full px-4 py-2.5 text-sm outline-none transition-all"
            disabled={loading || sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || sending}
            className={`p-2.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim() && !loading && !sending
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {sending ? <Loader2 className="w-4 h-4 ml-0.5 animate-spin"/> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  )
}
