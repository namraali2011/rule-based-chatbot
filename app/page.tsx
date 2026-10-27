
"use client";

import { useEffect, useRef, useState } from "react";
import rules from "./rules.json";

type Rule = {
  intent: string;
  keywords: string[];
  reply: string;
};

type Message = {
  id: number;
  role: "user" | "bot";
  text: string;
};

const quickQuestions = [
  { icon: "🎓", title: "Admissions", question: "How can I apply for admission?" },
  { icon: "💳", title: "Fee Structure", question: "What is the fee structure?" },
  { icon: "🕒", title: "Timings", question: "What are university timings?" },
  { icon: "📚", title: "Library", question: "Tell me about the library" },
  { icon: "🏠", title: "Hostel", question: "Is hostel accommodation available?" },
];

const services = [
  {
    icon: "🎓",
    title: "Admissions",
    description: "Explore admission procedures, eligibility and university programmes.",
    question: "Tell me about admissions",
  },
  {
    icon: "💳",
    title: "Fee Information",
    description: "Find guidance about tuition fees, payments and fee structures.",
    question: "What is the fee structure?",
  },
  {
    icon: "🕒",
    title: "University Timings",
    description: "Get help finding information about schedules and university hours.",
    question: "What are university timings?",
  },
  {
    icon: "📚",
    title: "Library Services",
    description: "Learn about books, research facilities and library resources.",
    question: "Tell me about the library",
  },
  {
    icon: "🏠",
    title: "Hostel Facilities",
    description: "Find guidance on accommodation, rooms and hostel services.",
    question: "Tell me about hostel facilities",
  },
];

const greeting =
  "Assalam-o-Alaikum! 👋 Welcome to UOS Helpdesk Bot. I can help you with admissions, fees, class timings, library services and hostel information. What would you like to know?";

const fallback =
  "I'm sorry, I don't have an answer to that question yet. Please ask about admissions, fees, timings, library facilities or hostels. For other information, visit https://su.edu.pk.";

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function getBotReply(message: string) {
  const normalized = normalizeText(message);

  const matchedRule = (rules as Rule[]).find((rule) =>
    rule.keywords.some((keyword) =>
      normalized.includes(normalizeText(keyword))
    )
  );

  return matchedRule ? matchedRule.reply : fallback;
}

function MessageContent({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
        part.startsWith("https://") || part.startsWith("http://") ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-semibold underline underline-offset-2"
          >
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "bot",
      text: greeting,
    },
  ]);

  const nextId = useRef(2);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (chatOpen) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [messages, chatOpen, isTyping]);

  useEffect(() => {
    if (chatOpen) {
      inputRef.current?.focus();
    }
  }, [chatOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function sendMessage(customText?: string) {
    const text = (customText ?? input).trim();

    if (!text || isTyping) return;

    setChatOpen(true);

    const userMessage: Message = {
      id: nextId.current++,
      role: "user",
      text,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setIsTyping(true);

    const reply = getBotReply(text);

    timerRef.current = setTimeout(() => {
      setMessages((previous) => [
        ...previous,
        {
          id: nextId.current++,
          role: "bot",
          text: reply,
        },
      ]);

      setIsTyping(false);
      timerRef.current = null;
    }, 500);
  }

  function resetChat() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsTyping(false);
    setInput("");

    setMessages([
      {
        id: nextId.current++,
        role: "bot",
        text: greeting,
      },
    ]);
  }

  return (
    <main className="min-h-screen bg-[#f7f9fd] text-slate-800">

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e438d] text-2xl text-white">
              🎓
            </div>

            <div>
              <h1 className="text-base font-extrabold tracking-tight text-[#172c52] sm:text-lg">
                UOS Student Portal
              </h1>
              <p className="text-[10px] font-medium text-slate-500 sm:text-xs">
                University of Sargodha
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#" className="text-[#1e438d] hover:text-blue-600">
              Home
            </a>
            <a href="#services" className="hover:text-blue-600">
              Services
            </a>
            <a href="#about" className="hover:text-blue-600">
              About
            </a>
          </div>

          <button
            onClick={() => setChatOpen(true)}
            className="rounded-xl bg-[#1e438d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#15336e] sm:px-5 sm:text-sm"
          >
            Chat with Us ↗
          </button>
        </nav>
      </header>

      {/* HERO SECTION */}
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#edf3ff] via-white to-[#e8f0ff]">

        {/* Soft background effects */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 py-24 text-center sm:px-8 md:py-32">

          {/* Small heading badge */}
          <span className="mb-7 inline-flex items-center rounded-full border border-blue-200 bg-white px-5 py-2 text-xs font-bold tracking-wide text-[#1e438d] shadow-sm">
            ✨ SMART STUDENT ASSISTANCE
          </span>

          {/* Main heading */}
          <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-[#172c52] sm:text-5xl md:text-6xl">
            Your University Journey,
            <span className="block text-[#3263bd]">
              Made Easier.
            </span>
          </h2>

          {/* Description */}
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Welcome to UOS Student Portal.
            Get quick and simple guidance about admissions,
            fee information, class timings, library services,
            and hostel facilities at the University of Sargodha.
          </p>

          {/* Buttons */}
          <div className="mt-9 flex flex-wrap justify-center gap-4">

            <button
              onClick={() => setChatOpen(true)}
              className="rounded-xl bg-[#1e438d] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-1 hover:bg-[#15336e]"
            >
              💬 Ask UOS Helpdesk
            </button>

            <a
              href="#services"
              className="rounded-xl border border-blue-200 bg-white px-8 py-4 text-sm font-bold text-[#1e438d] transition-all hover:-translate-y-1 hover:bg-blue-50"
            >
              Explore Services ↓
            </a>

          </div>

          {/* Features */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-semibold text-slate-500 sm:text-sm">
            <span>✓ Instant Replies</span>
            <span>✓ Easy Navigation</span>
            <span>✓ Free Student Guidance</span>
            <span>✓ Available Anytime</span>
          </div>

        </div>
      </section>


      {/* SERVICES */}
      <section id="services" className="scroll-mt-24 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Student Services
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#172c52] sm:text-4xl">
              How Can We Help You?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
              Find helpful guidance for common university questions.
              Select any topic to start a conversation.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <button
                key={service.title}
                onClick={() => sendMessage(service.question)}
                className="group rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60 disabled:opacity-50"
                disabled={isTyping}
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl transition group-hover:bg-blue-100">
                  {service.icon}
                </div>

                <h3 className="text-lg font-bold text-[#172c52]">
                  {service.title}
                </h3>

                <p className="mt-3 min-h-14 text-sm leading-7 text-slate-500">
                  {service.description}
                </p>

                <span className="mt-5 inline-flex items-center text-sm font-bold text-blue-700">
                  Ask a question
                  <span className="ml-2 transition group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </button>
            ))}

            <div className="flex flex-col justify-center rounded-3xl bg-[#1e438d] p-7 text-white">
              <div className="mb-5 text-4xl">💬</div>
              <h3 className="text-xl font-bold">
                Need Assistance?
              </h3>
              <p className="mt-3 text-sm leading-7 text-blue-100">
                Our rule-based virtual assistant is here to guide
                you through common student questions.
              </p>
              <button
                onClick={() => setChatOpen(true)}
                className="mt-6 w-fit rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#1e438d] transition hover:bg-blue-50"
              >
                Open Chatbot ↗
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
          <div className="rounded-3xl bg-gradient-to-br from-[#e9f1ff] to-[#f4f7ff] p-10 text-center">
            <div className="text-7xl">🎓</div>
            <h3 className="mt-5 text-2xl font-extrabold text-[#172c52]">
              University of Sargodha
            </h3>
            <p className="mt-3 text-sm text-slate-500">
              Student Information & Assistance
            </p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              About this project
            </span>
            <h2 className="mt-3 text-3xl font-black text-[#172c52] sm:text-4xl">
              Student Support,
              Simplified.
            </h2>
            <p className="mt-6 text-sm leading-8 text-slate-600">
              UOS Helpdesk Bot is an independent educational project
              designed to make common university information easier
              to access.
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-600">
              The chatbot uses predefined questions, keywords and
              answers to respond instantly. It does not require
              an external AI service or access to personal data.
            </p>
            <a
              href="https://su.edu.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block font-bold text-blue-700 hover:underline"
            >
              Visit Official UOS Website ↗
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-[#f7f9fd] px-5 py-8 text-center">
        <p className="font-bold text-[#172c52]">
          🎓 UOS Helpdesk Bot
        </p>
        <p className="mt-2 text-xs leading-6 text-slate-500">
          © 2026 UOS Helpdesk Bot • Independent educational demo
          • Not an official University of Sargodha service
        </p>
      </footer>

      {/* FLOATING CHAT BUTTON */}
      {!chatOpen && (
        <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
          <div className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-lg">
            👋 Need help? Chat with us!
          </div>

          <button
            onClick={() => setChatOpen(true)}
            aria-label="Open UOS chatbot"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e438d] text-3xl text-white shadow-xl shadow-blue-300 transition duration-300 hover:scale-110 hover:bg-[#15336e] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-300"
          >
            💬
          </button>
        </div>
      )}

      {/* CHATBOT POPUP */}
      {chatOpen && (
        <section
          role="dialog"
          aria-label="UOS Helpdesk Chatbot"
          className="fixed bottom-3 right-3 z-50 flex h-[min(650px,calc(100dvh-24px))] w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-400/30 sm:bottom-7 sm:right-7 sm:w-[390px]"
        >
          {/* CHAT HEADER */}
          <div className="flex items-center justify-between gap-3 bg-[#1e438d] px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl">
                🤖
              </div>

              <div>
                <h3 className="text-sm font-bold">
                  UOS Helpdesk Bot
                </h3>
                <p className="mt-1 text-[11px] text-blue-100">
                  ● Ready to answer
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetChat}
                title="Clear chat"
                aria-label="Clear chat"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg transition hover:bg-white/20"
              >
                ↻
              </button>

              <button
                onClick={() => setChatOpen(false)}
                title="Close chat"
                aria-label="Close chat"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xl transition hover:bg-white/20"
              >
                ×
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f7f9fd] p-4">
            <div className="text-center">
              <span className="rounded-full bg-white px-3 py-1 text-[10px] text-slate-400">
                UOS Student Assistant
              </span>
            </div>

            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base">
                      🤖
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-6 shadow-sm ${
                      isUser
                        ? "rounded-br-sm bg-[#1e438d] text-white"
                        : "rounded-bl-sm border border-slate-100 bg-white text-slate-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      <MessageContent text={message.text} />
                    </p>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  🤖
                </div>
                <div className="flex gap-1.5 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* QUICK QUESTION CHIPS */}
          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-white px-3 py-3">
            {quickQuestions.map((item) => (
              <button
                key={item.title}
                onClick={() => sendMessage(item.question)}
                disabled={isTyping}
                className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-[#1e438d] transition hover:bg-blue-100 disabled:opacity-50"
              >
                {item.icon} {item.title}
              </button>
            ))}
          </div>

          {/* CHAT INPUT */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="border-t border-slate-100 bg-white p-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-blue-400">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your question..."
                aria-label="Type your question"
                disabled={isTyping}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="rounded-lg bg-[#1e438d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#15336e] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send ↗
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-slate-400">
              Rule-based bot • Verify official information with UOS
            </p>
          </form>
        </section>
      )}
    </main>
  );
}
