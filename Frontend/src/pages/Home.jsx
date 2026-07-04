import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../api/axios'
import ChatSidebar from '../components/ChatSidebar'
import ChatMessages from '../components/ChatMessages'
import ChatComposer from '../components/ChatComposer'

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}\\s*=\\s*([^;]*)`))
  return match ? match[1] : null
}

export default function Home() {
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [creatingChat, setCreatingChat] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [socketError, setSocketError] = useState(null)
  const socketRef = useRef(null)
  const sendingTimeoutRef = useRef(null)

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get('/chat')
      setChats(res.data.chats)
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const fetchMessages = useCallback(async (chatId) => {
    try {
      setLoading(true)
      const res = await api.get(`/chat/messages/${chatId}`)
      setMessages(res.data.messages)
    } catch (err) {
      console.error('Failed to fetch messages', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  useEffect(() => {
    if (!activeChatId) return
    fetchMessages(activeChatId)
  }, [activeChatId, fetchMessages])

  useEffect(() => {
    const token = getCookie('token')
    if (!token) {
      navigate('/login')
      return
    }

    setSocketError(null)
    setSocketConnected(false)

    const socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setSocketConnected(true)
      setSocketError(null)
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    socket.on('connect_error', (err) => {
      setSocketConnected(false)
      setSocketError(err.message)
    })

    socket.on('ai-response', (data) => {
      setMessages(prev => [...prev, {
        _id: Date.now().toString(),
        role: 'model',
        content: data.content,
        chat: data.chat
      }])
      setSending(false)
      clearTimeout(sendingTimeoutRef.current)
      sendingTimeoutRef.current = null
    })

    return () => {
      clearTimeout(sendingTimeoutRef.current)
      socket.close()
      socketRef.current = null
    }
  }, [navigate])

  useEffect(() => {
    if (!activeChatId) return
    setChats(prev => prev.map(c => ({
      ...c,
      lastActivity: c._id === activeChatId ? new Date().toISOString() : c.lastActivity
    })))
  }, [messages, activeChatId])

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId)
    setMessages([])
  }

  const handleNewChat = () => {
    setNewChatTitle('')
    setShowNewChatModal(true)
  }

  const handleLogout = () => {
    document.cookie = 'token=; max-age=0; path=/'
    socketRef.current?.close()
    navigate('/login')
  }

  const handleCreateChat = async () => {
    if (!newChatTitle.trim()) return
    setCreatingChat(true)
    try {
      const res = await api.post('/chat', { title: newChatTitle.trim() })
      const newChat = res.data.chat
      setChats(prev => [newChat, ...prev])
      setActiveChatId(newChat._id)
      setMessages([])
      setShowNewChatModal(false)
      setNewChatTitle('')
    } catch (err) {
      console.error('Failed to create chat', err)
    } finally {
      setCreatingChat(false)
    }
  }

  const handleSend = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || !activeChatId || sending) return

    if (!socketConnected) {
      setSocketError('Not connected to server. Please wait or refresh.')
      return
    }

    const userMsg = {
      _id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      chat: activeChatId
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    setSocketError(null)

    socketRef.current.emit('ai-message', { chat: activeChatId, content: trimmed })

    sendingTimeoutRef.current = setTimeout(() => {
      setSending(false)
      setSocketError('Response timed out. Please try again.')
    }, 30000)
  }

  if (loading && chats.length === 0) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="home-shell">
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="mobile-header-title">ChatGPT</span>
        <button className="hamburger-btn" onClick={handleNewChat}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <main className="chat-panel">
        <ChatMessages
          messages={messages}
          sending={sending}
          socketError={socketError}
        />
        <ChatComposer
          input={input}
          setInput={setInput}
          onSend={handleSend}
          sending={sending}
          socketConnected={socketConnected}
        />
      </main>

      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">New chat</h2>
            <input
              type="text"
              className="modal-input"
              placeholder="Enter chat title..."
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateChat() }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setShowNewChatModal(false)}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-primary" onClick={handleCreateChat} disabled={creatingChat || !newChatTitle.trim()}>
                {creatingChat ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
