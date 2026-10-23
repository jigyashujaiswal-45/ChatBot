import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [isWaiting, setIsWaiting] = useState(false)
  const socketRef = useRef(null)
  const messageEndRef = useRef(null)

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3000')
    socketRef.current = socket

    function handleResponse(data) {
      setIsWaiting(false)
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          sender: 'assistant',
          content: data?.response || data?.error || 'No response was returned.',
          sentAt: new Date(),
        },
      ])
    }

    function handleDisconnect() {
      setConnectionStatus('disconnected')
      setIsWaiting(false)
    }

    socket.on('connect', () => setConnectionStatus('connected'))
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleDisconnect)
    socket.on('ai-message-response', handleResponse)

    return () => {
      socket.off('ai-message-response', handleResponse)
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage(event) {
    event.preventDefault()
    const content = draft.trim()

    if (!content || isWaiting || !socketRef.current?.connected) return

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        sender: 'user',
        content,
        sentAt: new Date(),
      },
    ])
    setIsWaiting(true)
    socketRef.current.emit('ai-message', { prompt: content })
    setDraft('')
  }

  function startNewChat() {
    if (isWaiting) return
    setMessages([])
    setDraft('')
  }

  return (
    <main className="chat-app">
      <aside className="chat-sidebar">
        <a className="brand" href="#home" aria-label="Morrow home">
          <span className="brand-mark" aria-hidden="true">m</span>
          <span>morrow</span>
        </a>

        <button
          className="new-chat-button"
          onClick={startNewChat}
          type="button"
          disabled={isWaiting}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 4v12M4 10h12" />
          </svg>
          <span>New conversation</span>
          <kbd>⌘ K</kbd>
        </button>

        <div className="sidebar-section-label">WORKSPACE</div>
        <div className="workspace-row">
          <span className="workspace-dot" />
          <span>Personal space</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m7 8 3 3 3-3" />
          </svg>
        </div>

        <div className="sidebar-bottom">
          <div className="plan-note">
            <span className="plan-icon" aria-hidden="true">✳</span>
            <div>
              <strong>A fresh perspective</strong>
              <span>One thought at a time.</span>
            </div>
          </div>
          <button className="profile-button" type="button">
            <span className="avatar">JD</span>
            <span className="profile-name">Jordan Davis</span>
            <span className="profile-menu" aria-hidden="true">···</span>
          </button>
        </div>
      </aside>

      <section className="chat-panel" aria-label="Chat conversation">
        <header className="chat-header">
          <div className="conversation-title">
            <span>Personal space</span>
            <span className="title-divider">/</span>
            <strong>New conversation</strong>
          </div>
          <div
            className={`connection-status connection-status--${connectionStatus}`}
            aria-live="polite"
          >
            <span />
            {connectionStatus === 'connected' ? 'Connected' : connectionStatus}
          </div>
          <button className="header-action" type="button" aria-label="More options">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="4" cy="10" r="1" />
              <circle cx="10" cy="10" r="1" />
              <circle cx="16" cy="10" r="1" />
            </svg>
          </button>
        </header>

        <div className={`conversation ${messages.length ? 'has-messages' : ''}`}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="welcome-mark" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <p className="eyebrow">A CLEARER KIND OF CHAT</p>
              <h1>What’s on your mind?</h1>
              <p className="welcome-copy">
                Start with a thought, a question, or whatever you’re working through.
              </p>
            </div>
          ) : (
            <div className="message-list" aria-live="polite">
              {messages.map((message) => (
                <article
                  className={`message-row message-row--${message.sender}`}
                  key={message.id}
                >
                  <span
                    className={`message-avatar ${message.sender === 'assistant' ? 'message-avatar--assistant' : ''}`}
                    aria-hidden="true"
                  >
                    {message.sender === 'assistant' ? 'm' : 'JD'}
                  </span>
                  <div className="message-body">
                    <div className="message-meta">
                      <strong>{message.sender === 'assistant' ? 'Morrow' : 'You'}</strong>
                      <time dateTime={message.sentAt.toISOString()}>
                        {message.sentAt.toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}
              {isWaiting && (
                <div className="typing-row" role="status">
                  <span className="message-avatar message-avatar--assistant" aria-hidden="true">
                    m
                  </span>
                  <span>Morrow is thinking</span>
                  <i />
                  <i />
                  <i />
                </div>
              )}
              <div ref={messageEndRef} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          <form className="composer" onSubmit={sendMessage}>
            <textarea
              aria-label="Write a message"
              placeholder="Message Morrow..."
              rows="1"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form.requestSubmit()
                }
              }}
              disabled={isWaiting}
            />
            <div className="composer-footer">
              <span className="composer-hint">Shift + Enter for a new line</span>
              <button
                className="send-button"
                type="submit"
                aria-label="Send message"
                disabled={!draft.trim() || isWaiting || connectionStatus !== 'connected'}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 15V5m-4 4 4-4 4 4" />
                </svg>
              </button>
            </div>
          </form>
          <p className="composer-disclaimer">Morrow can make mistakes. Check important details.</p>
        </div>
      </section>
    </main>
  )
}

export default App
