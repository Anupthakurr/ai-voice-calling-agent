"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

interface Message {
  id: string;
  role: "user" | "ai";
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

const STACK = ["React", "Next.js", "Node.js", "MongoDB", "Python", "Gemini AI", "RAG"];

function Icon({
  name,
  className,
}: {
  name: "bot" | "user" | "mic" | "phone" | "send" | "stop" | "calendar" | "spark" | "close";
  className?: string;
}) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  const paths = {
    bot: (
      <>
        <path d="M12 8V4" />
        <rect x="5" y="8" width="14" height="12" rx="4" />
        <path d="M8 13h.01M16 13h.01M9 17h6" />
      </>
    ),
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    mic: (
      <>
        <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
        <path d="M19 11a7 7 0 0 1-14 0M12 18v3" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8 9.71a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92Z" />
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    calendar: (
      <>
        <path d="M8 2v4M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M3 10h18" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function TypingIndicator() {
  return (
    <div className="typing-indicator" aria-label="AI is typing">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

function SourceBadges({ sources }: { sources: string[] }) {
  if (!sources.length) return null;
  return (
    <div className="source-row">
      {sources.map((source, index) => (
        <span key={`${source}-${index}`} className="source-badge">
          {source}
        </span>
      ))}
    </div>
  );
}

function CalendarWidget({ onBook }: { onBook: (info: { dateTime: string; name: string; email: string }) => void }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"slots" | "form">("slots");

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setSlots([]);
      try {
        const response = await fetch(`/api/calendar?date=${date}`);
        const data = await response.json();
        setSlots(data.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [date]);

  if (step === "form") {
    return (
      <div className="calendar-widget">
        <p className="calendar-context">
          <Icon name="calendar" /> Booking <strong>{selectedSlot}</strong>
        </p>
        <input className="chat-input compact" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
        <input
          className="chat-input compact"
          placeholder="Your email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <div className="calendar-actions">
          <button className="secondary-btn" onClick={() => setStep("slots")}>
            Back
          </button>
          <button className="primary-btn" disabled={!name || !email} onClick={() => onBook({ dateTime: selectedSlot!, name, email })}>
            Confirm booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-widget">
      <label className="date-row">
        <span>Select date</span>
        <input type="date" value={date} min={new Date().toISOString().split("T")[0]} onChange={(event) => setDate(event.target.value)} />
      </label>
      {loading ? (
        <p className="muted">Checking availability...</p>
      ) : slots.length === 0 ? (
        <p className="muted">No slots available on this date.</p>
      ) : (
        <div className="slot-grid">
          {slots.slice(0, 8).map((slot, index) => (
            <button
              key={`${slot.start}-${index}`}
              className={`slot-btn ${selectedSlot === slot.start ? "selected" : ""}`}
              onClick={() => {
                setSelectedSlot(slot.start);
                setStep("form");
              }}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/• /g, "<br/>• ")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

function MessageBubble({ msg, onBook }: { msg: Message; onBook: (info: { dateTime: string; name: string; email: string }) => void }) {
  const isUser = msg.role === "user";
  const showCalendar = !isUser && msg.content.toLowerCase().includes("calendar:");

  return (
    <div className={`message-row ${isUser ? "from-user" : "from-ai"} animate-fade-in-up`}>
      <div className="avatar" aria-hidden="true">
        <Icon name={isUser ? "user" : "bot"} />
      </div>
      <div className="message-stack">
        <div className={`message-bubble ${isUser ? "msg-user" : "msg-ai"}`}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div className="ai-prose" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
          )}
        </div>
        {!isUser && <SourceBadges sources={msg.sources || []} />}
        {showCalendar && <CalendarWidget onBook={onBook} />}
        <p className="timestamp">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "ai",
      content:
        "Hi there! I'm the AI representative for **Anup Kumar Thakur**, a Full Stack Developer and AI Engineer.\n\nAsk me about his projects, skills, experience, or type **book** to schedule an interview.",
      sources: [],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callNumber, setCallNumber] = useState("");
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "success" | "error">("idle");
  const [isWebCalling, setIsWebCalling] = useState(false);
  const [isVapiConnected, setIsVapiConnected] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const vapiRef = useRef<any>(null);

  useEffect(() => {
    try {
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setIsWebCalling(true);
        setIsVapiConnected(true);
      });
      vapi.on("call-end", () => {
        setIsWebCalling(false);
        setIsVapiConnected(false);
      });
      vapi.on("error", (error: unknown) => {
        console.error("Vapi error:", error);
        setIsWebCalling(false);
        setIsVapiConnected(false);
      });
    } catch (error) {
      console.error("Failed to initialize Vapi:", error);
    }

    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const toggleWebCall = () => {
    if (!vapiRef.current) {
      alert("Voice SDK is not initialized. Add NEXT_PUBLIC_VAPI_PUBLIC_KEY and redeploy.");
      return;
    }

    if (isWebCalling || isVapiConnected) {
      vapiRef.current.stop();
      setIsWebCalling(false);
      setIsVapiConnected(false);
      return;
    }

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) {
      alert("Assistant ID is missing. Add NEXT_PUBLIC_VAPI_ASSISTANT_ID and redeploy.");
      return;
    }

    setIsWebCalling(true);
    vapiRef.current.start(assistantId);
  };

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: messageText,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);

    try {
      const lowerText = messageText.toLowerCase();
      if (lowerText.includes("book") || lowerText.includes("schedule") || lowerText.includes("interview") || lowerText.includes("meeting")) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-ai`,
            role: "ai",
            content: "Calendar: I can help you schedule time with Anup. Pick a date and time below that works for you.",
            sources: [],
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ai`,
          role: "ai",
          content: data.reply || "Sorry, I could not generate a response.",
          sources: data.sources || [],
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: "ai",
          content: "Sorry, something went wrong. Please try again.",
          sources: [],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBook = async (info: { dateTime: string; name: string; email: string }) => {
    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.error || "Failed to book meeting");

      const date = new Date(data.start);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: `**Meeting confirmed!** You're scheduled with Anup on **${date.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}** at **${date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          })} IST**.\n\nThe meeting has been added to Anup's calendar.`,
          sources: [],
          timestamp: new Date(),
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: `Sorry, there was an error booking the meeting: ${error.message || "Please try again."}`,
          sources: [],
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app-shell">
      <aside className="profile-panel">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Icon name="spark" />
          </div>
          <div>
            <p className="eyebrow">AI candidate representative</p>
            <h1>Anup Thakur</h1>
          </div>
        </div>

        <div className="call-card">
          <p>Prefer voice?</p>
          <button className={`primary-btn wide ${isWebCalling ? "danger" : ""}`} onClick={toggleWebCall}>
            <Icon name={isVapiConnected ? "stop" : "mic"} />
            {isVapiConnected ? "End browser call" : isWebCalling ? "Connecting..." : "Talk in browser"}
          </button>
          <button className="secondary-btn wide" onClick={() => setShowCallModal(true)}>
            <Icon name="phone" />
            Have the AI call you
          </button>
          <a className="phone-link" href="tel:+12137581764">
            +1 (213) 758-1764
          </a>
        </div>

        <div className="portrait-card">
          <div className="portrait">
            <span>AT</span>
          </div>
          <div>
            <h2>Full Stack Developer and AI Engineer</h2>
            <p>B.Tech CSE @ BPIT Delhi, 2023-27. Building practical AI tools with clean product thinking.</p>
          </div>
        </div>

        <div className="metric-grid">
          <div>
            <strong>900+</strong>
            <span>DSA problems</span>
          </div>
          <div>
            <strong>1712</strong>
            <span>LeetCode rating</span>
          </div>
          <div>
            <strong>RAG</strong>
            <span>Grounded answers</span>
          </div>
          <div>
            <strong>Live</strong>
            <span>Voice calls</span>
          </div>
        </div>

        <div className="stack-row">
          {STACK.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </aside>

      <main className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="eyebrow">RAG-powered chat</p>
            <h2>Ask about projects, skills, or availability</h2>
          </div>
          <div className="status-pill">
            <span />
            Online
          </div>
        </header>

        <section className="messages" aria-live="polite">
          {messages.length <= 1 && (
            <div className="starter-panel animate-fade-in-up">
              <div>
                <p className="eyebrow">Start fast</p>
                <h3>Pick a prompt or ask naturally.</h3>
              </div>
              <div className="suggestion-grid">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button key={question} className="suggestion-btn" onClick={() => sendMessage(question)}>
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} msg={message} onBook={handleBook} />
          ))}

          {isLoading && (
            <div className="message-row from-ai animate-fade-in-up">
              <div className="avatar" aria-hidden="true">
                <Icon name="bot" />
              </div>
              <div className="message-stack">
                <div className="message-bubble msg-ai">
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </section>

        <footer className="composer">
          <div className="composer-box">
            <textarea
              className="chat-input"
              rows={1}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                event.target.style.height = "auto";
                event.target.style.height = `${Math.min(event.target.scrollHeight, 128)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Anup's skills, projects, or type 'book'..."
              disabled={isLoading}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={isLoading || !input.trim()} aria-label="Send message">
              <Icon name="send" />
            </button>
          </div>
          <p>Grounded on Anup's resume and project data. Built for AI Engineer screening conversations.</p>
        </footer>
      </main>

      {showCallModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="call-modal-title">
          <div className="modal">
            <button
              className="icon-btn"
              onClick={() => {
                setShowCallModal(false);
                setCallStatus("idle");
              }}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
            <h3 id="call-modal-title">Request an outbound call</h3>
            <p>Enter your phone number with country code and the AI voice agent will call immediately.</p>
            <input className="chat-input compact" type="tel" placeholder="+91..." value={callNumber} onChange={(event) => setCallNumber(event.target.value)} />
            {callStatus === "error" && <p className="form-error">Failed to place the call. Check the number and try again.</p>}
            {callStatus === "success" && <p className="form-success">Call initiated. Your phone should ring shortly.</p>}
            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => {
                  setShowCallModal(false);
                  setCallStatus("idle");
                }}
              >
                Close
              </button>
              <button
                className="primary-btn"
                disabled={!callNumber || callStatus === "calling" || callStatus === "success"}
                onClick={async () => {
                  setCallStatus("calling");
                  try {
                    const response = await fetch("/api/call", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ phoneNumber: callNumber }),
                    });
                    setCallStatus(response.ok ? "success" : "error");
                  } catch {
                    setCallStatus("error");
                  }
                }}
              >
                {callStatus === "calling" ? "Calling..." : "Call me"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
