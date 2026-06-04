'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
  timestamp: Date;
}

interface CalendarSlot {
  start: string;
  label: string;
}

const SUGGESTED_QUESTIONS = [
  "Why is Anup a great fit for the Scaler AI Engineer role?",
  "Tell me about the hintro-ai-backened project",
  "What tech stacks does Anup know?",
  "What are Anup's achievements on LeetCode?",
  "Tell me about ImageEnhance AI",
  "Book an interview with Anup",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

function SourceBadges({ sources }: { sources: string[] }) {
  if (!sources.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {sources.map((s, i) => (
        <span key={i} className="source-badge">{s}</span>
      ))}
    </div>
  );
}

function CalendarWidget({ onBook }: { onBook: (info: { dateTime: string; name: string; email: string }) => void }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'slots' | 'form'>('slots');

  const fetchSlots = async () => {
    setLoading(true);
    setSlots([]);
    try {
      const res = await fetch(`/api/calendar?date=${date}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchSlots(); }, [date]);

  if (step === 'form') {
    return (
      <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          📅 Booking: <strong style={{ color: 'var(--accent-green)' }}>{selectedSlot}</strong>
        </p>
        <input
          className="chat-input px-3 py-2 mb-2 block"
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ borderRadius: 8, fontSize: 13 }}
        />
        <input
          className="chat-input px-3 py-2 mb-3 block"
          placeholder="Your Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ borderRadius: 8, fontSize: 13 }}
        />
        <div className="flex gap-2">
          <button className="pill-btn flex-1" onClick={() => setStep('slots')}>← Back</button>
          <button
            className="pill-btn flex-1"
            style={{ background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }}
            disabled={!name || !email}
            onClick={() => onBook({ dateTime: selectedSlot!, name, email })}
          >
            Confirm Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Select date:</span>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => setDate(e.target.value)}
          className="chat-input px-2 py-1"
          style={{ width: 'auto', fontSize: 13, borderRadius: 8 }}
        />
      </div>
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Checking availability…</p>
      ) : slots.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No slots available on this date.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.slice(0, 8).map((slot, i) => (
            <button
              key={i}
              className={`slot-btn ${selectedSlot === slot.start ? 'selected' : ''}`}
              onClick={() => { setSelectedSlot(slot.start); setStep('form'); }}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg, onBook }: { msg: Message; onBook: (info: any) => void }) {
  const isUser = msg.role === 'user';
  const showCalendar = !isUser && msg.content.toLowerCase().includes('📅');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1"
          style={{ background: 'var(--gradient-1)', fontSize: 14 }}>
          🤖
        </div>
      )}
      <div style={{ maxWidth: '78%' }}>
        <div className={`px-4 py-3 ${isUser ? 'msg-user' : 'msg-ai'}`}>
          {isUser ? (
            <p style={{ fontSize: 15, lineHeight: 1.5 }}>{msg.content}</p>
          ) : (
            <div className="ai-prose" style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
            />
          )}
        </div>
        {!isUser && <SourceBadges sources={msg.sources || []} />}
        {showCalendar && <CalendarWidget onBook={onBook} />}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-1"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 14 }}>
          👤
        </div>
      )}
    </div>
  );
}

function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/• /g, '<br/>• ')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      content: "Hi there! 👋 I'm the AI representative for **Anup Kumar Thakur** — Full Stack Developer & AI Engineer.\n\nYou can ask me anything about his background, projects, skills, or you can book an interview directly. What would you like to know?",
      sources: [],
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Check for booking intent
      const lowerText = messageText.toLowerCase();
      if (lowerText.includes('book') || lowerText.includes('schedule') || lowerText.includes('interview') || lowerText.includes('meeting')) {
        const aiMsg: Message = {
          id: Date.now().toString() + '-ai',
          role: 'ai',
          content: "📅 I'd love to help you schedule time with Anup! Please select a date and time below that works for you:",
          sources: [],
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      const data = await res.json();

      const aiMsg: Message = {
        id: Date.now().toString() + '-ai',
        role: 'ai',
        content: data.reply || 'Sorry, I could not generate a response.',
        sources: data.sources || [],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-err',
        role: 'ai',
        content: 'Sorry, something went wrong. Please try again.',
        sources: [],
        timestamp: new Date(),
      }]);
    }
    setIsLoading(false);
  };

  const handleBook = async (info: { dateTime: string; name: string; email: string }) => {
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });
      const data = await res.json();
      if (data.success) {
        const d = new Date(data.start);
        const confirmMsg: Message = {
          id: Date.now().toString(),
          role: 'ai',
          content: `✅ **Meeting confirmed!** You're scheduled with Anup on **${d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}** at **${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST**.\n\nA calendar invite has been sent to ${info.email}. See you then! 🎉`,
          sources: [],
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, confirmMsg]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: 'Sorry, there was an error booking the meeting. Please try again.',
        sources: [],
        timestamp: new Date(),
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ 
      background: 'var(--bg-primary)', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glows */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(255,107,107,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Header */}
      <header className="glass" style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--gradient-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
              boxShadow: '0 0 16px rgba(108,99,255,0.4)',
            }}>🤖</div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Anup Thakur <span className="gradient-text">AI Persona</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="status-dot animate-pulse-glow" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Online — RAG-powered · Gemini 2.0</span>
              </div>
            </div>
          </div>
          <a
            href="tel:+12137581764"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(78,204,163,0.12)', border: '1px solid rgba(78,204,163,0.3)',
              color: 'var(--accent-green)', borderRadius: 20, padding: '6px 14px',
              fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s'
            }}
            title="Call the voice agent"
          >
            📞 +1 (213) 758-1764
          </a>
        </div>
      </header>

      {/* Messages */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Intro card */}
          {messages.length <= 1 && (
            <div className="glass animate-fade-in-up" style={{ borderRadius: 16, padding: 24, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div className="animate-float" style={{ fontSize: 40 }}>👨‍💻</div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Anup Kumar Thakur
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12, lineHeight: 1.6 }}>
                    B.Tech CSE @ BPIT Delhi (2023–27) · Full Stack Dev · AI Engineer · 900+ DSA problems solved · LeetCode 1712 rating
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['React', 'Next.js', 'Node.js', 'MongoDB', 'Python', 'Gemini AI', 'RAG'].map(t => (
                      <span key={t} className="source-badge">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onBook={handleBook} />
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start animate-fade-in-up">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
                style={{ background: 'var(--gradient-1)', fontSize: 14 }}>🤖</div>
              <div className="msg-ai">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div style={{ 
          padding: '12px 16px 0', 
          position: 'relative', zIndex: 1,
          maxWidth: 800, margin: '0 auto', width: '100%'
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 4 }}>
            Suggested questions:
          </p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button key={i} className="pill-btn flex-shrink-0" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <footer style={{
        position: 'sticky', bottom: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)', padding: '16px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="chat-input"
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Anup's skills, projects, or type 'book' to schedule an interview…"
            style={{ padding: '12px 16px', minHeight: 48, maxHeight: 120 }}
            disabled={isLoading}
          />
          <button
            id="send-button"
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            style={{ width: 48, height: 48, flexShrink: 0 }}
          >
            {isLoading ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          RAG-grounded answers from Anup's resume & GitHub · Built for Scaler AI Engineer screening
        </p>
      </footer>
    </div>
  );
}
