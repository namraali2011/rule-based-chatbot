
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import rulesData from "./rules.json";

// ==========================================
// TYPES
// ==========================================

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

type Service = {
  icon: string;
  title: string;
  description: string;
  question: string;
};

// ==========================================
// CHATBOT KNOWLEDGE BASE
// ==========================================

const rules = rulesData as Rule[];

const greeting =
  "Assalam-o-Alaikum! 👋 Welcome to UOS Helpdesk Bot. I can help you with admissions, fee structures, scholarships, merit lists, examinations, results, library services, hostels, transport and more. How can I help you today?";

const fallback =
  "I'm sorry, I couldn't find a reliable answer to that question. Please try asking in a different way. I can help with admissions, fees, scholarships, examinations, results, hostels, library facilities and transport. For official information, visit https://su.edu.pk.";

// ==========================================
// QUICK QUESTIONS
// ==========================================

const quickQuestions = [
  {
    icon: "🎓",
    title: "Admissions",
    question: "How can I apply for admission?",
  },
  {
    icon: "📋",
    title: "Merit Lists",
    question: "Where can I check the merit list?",
  },
  {
    icon: "💳",
    title: "Fees",
    question: "What is the fee structure?",
  },
  {
    icon: "🎁",
    title: "Scholarships",
    question: "How can I apply for a scholarship?",
  },
  {
    icon: "📝",
    title: "Exams",
    question: "Where can I find the exam date sheet?",
  },
  {
    icon: "📊",
    title: "Results",
    question: "How can I check my exam result?",
  },
  {
    icon: "📚",
    title: "Library",
    question: "Tell me about the library",
  },
  {
    icon: "🏠",
    title: "Hostel",
    question: "How do I apply for hostel accommodation?",
  },
  {
    icon: "🚌",
    title: "Transport",
    question: "Tell me about university transport",
  },
];

// ==========================================
// LANDING PAGE SERVICES
// ==========================================

const services: Service[] = [
  {
    icon: "🎓",
    title: "Admissions",
    description:
      "Explore admission procedures, eligibility criteria, deadlines and available programmes.",
    question: "How can I apply for admission?",
  },
  {
    icon: "💳",
    title: "Fee Information",
    description:
      "Find guidance about tuition fees, fee challans, payment methods and refunds.",
    question: "What is the fee structure?",
  },
  {
    icon: "🎁",
    title: "Scholarships",
    description:
      "Learn about scholarship opportunities, financial assistance and eligibility.",
    question: "How can I apply for a scholarship?",
  },
  {
    icon: "📝",
    title: "Examinations",
    description:
      "Access guidance about examinations, date sheets, results and transcripts.",
    question: "Where can I find the exam date sheet?",
  },
  {
    icon: "📚",
    title: "Library Services",
    description:
      "Find information about books, research resources and digital library facilities.",
    question: "Tell me about the library",
  },
  {
    icon: "🏠",
    title: "Hostel Facilities",
    description:
      "Learn about hostel accommodation, room allocation and applications.",
    question: "How do I apply for hostel accommodation?",
  },
  {
    icon: "🚌",
    title: "Transport",
    description:
      "Get guidance about university transport, bus routes and student services.",
    question: "Tell me about university transport",
  },
  {
    icon: "🕒",
    title: "University Timings",
    description:
      "Find guidance about class timetables, academic calendars and office hours.",
    question: "What are university timings?",
  },
];

// ==========================================
// TEXT NORMALIZATION
// ==========================================

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ==========================================
// KEYWORD SEARCH HELPERS
// ==========================================

function containsPhrase(
  message: string,
  keyword: string
): boolean {
  const cleanKeyword = normalizeText(keyword);

  if (!cleanKeyword) return false;

  return (` ${message} `).includes(` ${cleanKeyword} `);
}

// Basic spelling correction.
// Returns how many edits separate two words.

function editDistance(a: string, b: string): number {
  if (a === b) return 0;

  const previous = Array.from(
    { length: b.length + 1 },
    (_, index) => index
  );

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] +
          (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }

    for (let j = 0; j <= b.length; j++) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

// ==========================================
// SMARTER RULE MATCHING
// ==========================================

function calculateRuleScore(
  message: string,
  rule: Rule
): number {
  const messageWords = message.split(" ");
  let strongestMatch = 0;
  let exactMatches = 0;

  for (const keyword of rule.keywords) {
    const cleanKeyword = normalizeText(keyword);

    if (!cleanKeyword) continue;

    const keywordWords = cleanKeyword.split(" ");

    // Exact phrase match receives the
    // highest priority.
    if (containsPhrase(message, cleanKeyword)) {
      const score =
        keywordWords.length > 1
          ? 20 + keywordWords.length * 10
          : 10;

      strongestMatch = Math.max(
        strongestMatch,
        score
      );

      exactMatches++;
      continue;
    }

    // Typo tolerance for longer single words.
    if (
      keywordWords.length === 1 &&
      cleanKeyword.length >= 5
    ) {
      const typoMatch = messageWords.some(
        (word) =>
          word.length >= 5 &&
          Math.abs(
            word.length - cleanKeyword.length
          ) <= 1 &&
          editDistance(word, cleanKeyword) === 1
      );

      if (typoMatch) {
        strongestMatch = Math.max(
          strongestMatch,
          3
        );
      }
    }
  }

  if (strongestMatch === 0) return 0;

  const additionalMatches = Math.max(
    0,
    exactMatches - 1
  );

  return (
    strongestMatch +
    Math.min(additionalMatches, 3) * 2
  );
}

// ==========================================
// CHATBOT RESPONSE ENGINE
// ==========================================

function getBotReply(message: string): string {
  const normalized = normalizeText(message);

  if (!normalized) return fallback;

  let bestScore = 0;
  let bestReply = fallback;

  for (const rule of rules) {
    if (
      !rule ||
      !Array.isArray(rule.keywords) ||
      typeof rule.reply !== "string"
    ) {
      continue;
    }

    const score = calculateRuleScore(
      normalized,
      rule
    );

    if (score > bestScore) {
      bestScore = score;
      bestReply = rule.reply;
    }
  }

  // Require at least one reasonably strong match.
  if (bestScore < 5) {
    return fallback;
  }

  return bestReply;
}

// ==========================================
// MESSAGE CONTENT WITH CLICKABLE LINKS
// ==========================================

function MessageContent({
  text,
}: {
  text: string;
}) {
  const parts = text.split(
    /(https?:\/\/[^\s]+)/g
  );

  return (
    <>
      {parts.map((part, index) => {
        if (
          part.startsWith("https://") ||
          part.startsWith("http://")
        ) {
          // Remove trailing punctuation from URLs.
          const url = part.replace(/[.,;!?]+$/, "");
          const suffix = part.slice(url.length);

          return (
            <span key={index}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-semibold underline underline-offset-2"
              >
                {url}
              </a>
              {suffix}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function Home() {
  const [chatOpen, setChatOpen] =
    useState(false);

  const [input, setInput] =
    useState("");

  const [isTyping, setIsTyping] =
    useState(false);

  const [messages, setMessages] = useState<
    Message[]
  >([
    {
      id: 1,
      role: "bot",
      text: greeting,
    },
  ]);

  const nextId = useRef(2);

  const bottomRef =
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const timerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const chatButtonRef =
    useRef<HTMLButtonElement>(null);

  // ========================================
  // AUTO SCROLL
  // ========================================

  useEffect(() => {
    if (chatOpen) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [messages, chatOpen, isTyping]);

  // ========================================
  // FOCUS CHAT INPUT
  // ========================================

  useEffect(() => {
    if (chatOpen) {
      inputRef.current?.focus();
    }
  }, [chatOpen]);

  // ========================================
  // CLEANUP TIMER
  // ========================================

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // ========================================
  // CLOSE CHAT
  // ========================================

  const closeChat = useCallback(() => {
    setChatOpen(false);

    // Focus is restored to the floating button
    // after React renders it again.
  }, []);

  // ========================================
  // ESCAPE KEY SUPPORT
  // ========================================

  useEffect(() => {
    if (!chatOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeChat();
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [chatOpen, closeChat]);

  // ========================================
  // SEND MESSAGE
  // ========================================

  function sendMessage(customText?: string) {
    const text = (customText ?? input).trim();

    if (!text || isTyping) return;

    setChatOpen(true);

    const newMessage: Message = {
      id: nextId.current++,
      role: "user",
      text,
    };

    setMessages((previous) => [
      ...previous,
      newMessage,
    ]);

    setInput("");
    setIsTyping(true);

    const response = getBotReply(text);

    timerRef.current = setTimeout(() => {
      const botMessage: Message = {
        id: nextId.current++,
        role: "bot",
        text: response,
      };

      setMessages((previous) => [
        ...previous,
        botMessage,
      ]);

      setIsTyping(false);
      timerRef.current = null;
    }, 500);
  }

  // ========================================
  // RESET CHAT
  // ========================================

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

  // ========================================
  // PAGE UI
  // ========================================

  return (
    <main className="min-h-screen bg-[#f7f9fd] text-slate-800">

      {/* ===================================
          NAVIGATION
      =================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          <a
            href="#home"
            className="flex items-center gap-3"
          >
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
            <a
              href="#home"
              className="transition hover:text-blue-700"
            >
              Home
            </a>

            <a
              href="#services"
              className="transition hover:text-blue-700"
            >
              Services
            </a>

            <a
              href="#about"
              className="transition hover:text-blue-700"
            >
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

      {/* ===================================
          HERO SECTION
      =================================== */}

      <section
        id="home"
        className="relative scroll-mt-24 overflow-hidden bg-gradient-to-br from-[#edf3ff] via-white to-[#e8f0ff]"
      >
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 py-24 text-center sm:px-8 md:py-32">

          <span className="mb-7 inline-flex items-center rounded-full border border-blue-200 bg-white px-5 py-2 text-xs font-bold tracking-wide text-[#1e438d] shadow-sm">
            ✨ SMART STUDENT ASSISTANCE
          </span>

          <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-[#172c52] sm:text-5xl md:text-6xl">
            Your University Journey,
            <span className="block text-[#3263bd]">
              Made Easier.
            </span>
          </h2>

          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Welcome to UOS Student Portal.
            Get quick and simple guidance about
            admissions, fee information,
            scholarships, examinations, library
            services, hostel facilities and more
            at the University of Sargodha.
          </p>

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

          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-semibold text-slate-500 sm:text-sm">
            <span>✓ Instant Replies</span>
            <span>✓ Easy Navigation</span>
            <span>✓ Free Student Guidance</span>
            <span>✓ No Account Required</span>
          </div>
        </div>
      </section>

      {/* ===================================
          SERVICES SECTION
      =================================== */}

      <section
        id="services"
        className="scroll-mt-24 px-5 py-20 sm:px-8"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Student Services
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#172c52] sm:text-4xl">
              How Can We Help You?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
              Find useful guidance about common
              university questions. Select any
              topic to begin a conversation.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {services.map((service) => (
              <button
                key={service.title}
                onClick={() =>
                  sendMessage(service.question)
                }
                disabled={isTyping}
                className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl transition group-hover:bg-blue-100">
                  {service.icon}
                </div>

                <h3 className="text-lg font-bold text-[#172c52]">
                  {service.title}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-7 text-slate-500">
                  {service.description}
                </p>

                <span className="mt-5 inline-flex items-center text-sm font-bold text-blue-700">
                  Ask a Question
                  <span className="ml-2 transition group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </button>
            ))}

          </div>
        </div>
      </section>

      {/* ===================================
          CALL TO ACTION
      =================================== */}

      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-[#1e438d] to-[#3263bd] px-6 py-12 text-center text-white sm:px-12">

          <div className="mb-4 text-4xl">
            💬
          </div>

          <h2 className="text-2xl font-black sm:text-3xl">
            Have a Question?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-blue-100">
            Our virtual helpdesk is ready to guide
            you through common university enquiries.
            Simply open the chat and type your question.
          </p>

          <button
            onClick={() => setChatOpen(true)}
            className="mt-7 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#1e438d] transition hover:-translate-y-1 hover:bg-blue-50"
          >
            Open UOS Helpdesk ↗
          </button>

        </div>
      </section>

      {/* ===================================
          ABOUT SECTION
      =================================== */}

      <section
        id="about"
        className="scroll-mt-24 bg-white px-5 py-20 sm:px-8"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">

          <div className="rounded-3xl bg-gradient-to-br from-[#e9f1ff] to-[#f4f7ff] p-10 text-center">

            <div className="text-7xl">
              🎓
            </div>

            <h3 className="mt-5 text-2xl font-extrabold text-[#172c52]">
              University of Sargodha
            </h3>

            <p className="mt-3 text-sm text-slate-500">
              Student Information & Assistance
            </p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              About This Project
            </span>

            <h2 className="mt-3 text-3xl font-black text-[#172c52] sm:text-4xl">
              Student Support,
              Simplified.
            </h2>

            <p className="mt-6 text-sm leading-8 text-slate-600">
              UOS Helpdesk Bot is an independent
              educational project designed to
              help students find answers to
              frequently asked university questions.
            </p>

            <p className="mt-4 text-sm leading-8 text-slate-600">
              The chatbot uses a structured
              knowledge base and keyword relevance
              scoring to provide predefined answers.
              It works without an AI API, database,
              or external chatbot service.
            </p>

            <p className="mt-4 text-sm leading-8 text-slate-600">
              Information may change over time.
              Please verify important details
              through official university sources.
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

      {/* ===================================
          FOOTER
      =================================== */}

      <footer className="border-t border-slate-200 bg-[#f7f9fd] px-5 py-8 text-center">

        <p className="font-bold text-[#172c52]">
          🎓 UOS Helpdesk Bot
        </p>

        <p className="mt-2 text-xs leading-6 text-slate-500">
          © 2026 UOS Helpdesk Bot
          {" • "}
          Independent Educational Demo
          {" • "}
          Not an Official University Service
        </p>

      </footer>

      {/* ===================================
          FLOATING CHAT BUTTON
      =================================== */}

      {!chatOpen && (
        <button
          ref={chatButtonRef}
          onClick={() => setChatOpen(true)}
          aria-label="Open UOS Helpdesk chatbot"
          title="Open UOS Helpdesk"
          className="fixed bottom-6 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#1e438d] text-3xl text-white shadow-xl shadow-blue-300 transition-all duration-300 hover:scale-110 hover:bg-[#15336e] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-300 sm:bottom-8 sm:right-8"
        >
          💬
        </button>
      )}

      {/* ===================================
          CHATBOT POPUP
      =================================== */}

      {chatOpen && (
        <section
          role="dialog"
          aria-label="UOS Helpdesk Chatbot"
          className="fixed bottom-3 right-3 z-50 flex h-[min(650px,calc(100dvh-24px))] w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-400/30 sm:bottom-7 sm:right-7 sm:w-[400px]"
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
                  ● Ready to Help
                </p>
              </div>
            </div>

            <div className="flex gap-2">

              <button
                onClick={resetChat}
                title="Clear conversation"
                aria-label="Clear conversation"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg transition hover:bg-white/20"
              >
                ↻
              </button>

              <button
                onClick={closeChat}
                title="Close chatbot"
                aria-label="Close chatbot"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xl transition hover:bg-white/20"
              >
                ×
              </button>

            </div>
          </div>

          {/* CHAT MESSAGES */}

          <div
            role="log"
            aria-label="Chat conversation"
            aria-live="polite"
            aria-relevant="additions"
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[#f7f9fd] p-4"
          >

            <div className="text-center">
              <span className="rounded-full bg-white px-3 py-1 text-[10px] text-slate-400">
                UOS Student Assistant
              </span>
            </div>

            {messages.map((message) => {
              const isUser =
                message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${
                    isUser
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base">
                      🤖
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] rounded-2xl px-4 py-3 text-[13px] leading-6 shadow-sm ${
                      isUser
                        ? "rounded-br-sm bg-[#1e438d] text-white"
                        : "rounded-bl-sm border border-slate-100 bg-white text-slate-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      <MessageContent
                        text={message.text}
                      />
                    </p>
                  </div>

                </div>
              );
            })}

            {/* TYPING INDICATOR */}

            {isTyping && (
              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  🤖
                </div>

                <div className="flex gap-1.5 rounded-2xl bg-white px-4 py-3 shadow-sm">

                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />

                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                    style={{
                      animationDelay: "150ms",
                    }}
                  />

                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                    style={{
                      animationDelay: "300ms",
                    }}
                  />

                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ===================================
              QUICK QUESTIONS
          =================================== */}

          <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-slate-100 bg-white px-3 py-3">

            {quickQuestions.map((item) => (
              <button
                key={item.title}
                onClick={() =>
                  sendMessage(item.question)
                }
                disabled={isTyping}
                className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-[#1e438d] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {item.icon} {item.title}
              </button>
            ))}

          </div>

          {/* ===================================
              CHAT INPUT
          =================================== */}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="shrink-0 border-t border-slate-100 bg-white p-3"
          >

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Ask your question..."
                aria-label="Type your question"
                disabled={isTyping}
                maxLength={500}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={
                  !input.trim() || isTyping
                }
                className="rounded-lg bg-[#1e438d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#15336e] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send ↗
              </button>

            </div>

            <p className="mt-2 text-center text-[10px] text-slate-400">
              Rule-Based Assistant •
              Verify Important Information with UOS
            </p>

          </form>
        </section>
      )}

    </main>
  );
}
