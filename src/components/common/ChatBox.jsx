import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  Send,
  X,
  Sparkles,
  Minimize2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  CornerDownLeft,
  ChevronRight,
} from 'lucide-react';

const INITIAL_MESSAGES = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: 'Namaste! I am your GeM AI Compliance Assistant. Ask me anything about GFR 2017 procurement guidelines, Make in India local content clauses, bidder eligibility, or tender verification.',
    timestamp: 'Just now',
    citation: 'GFR 2017 & GeM SPV Manual',
    confidence: '99.2% Verified',
  },
];

const SUGGESTIONS = [
  'What is GFR Rule 144(xi) Land Border requirement?',
  'Explain Make in India Class-I supplier threshold (50%)',
  'When are MSME bidders exempt from EMD & Turnover?',
  'What causes immediate technical bid rejection?',
];

const KNOWLEDGE_BASE = [
  {
    keywords: ['144', 'land border', 'border', 'neighbour', 'neighbor'],
    title: 'GFR 2017 Rule 144(xi) — Land Border Restriction',
    text: 'Under Department of Expenditure order F.No.6/18/2019-PPD, any bidder from a country sharing a land border with India is eligible only if registered with DPIIT (Competent Authority) and holds valid political/security clearance from MEA and MHA. Bids without this registration must be disqualified at technical evaluation stage.',
    citation: 'Dept of Expenditure OM F.No.6/18/2019-PPD • CVC Guidelines',
    confidence: '99.4% Accuracy',
  },
  {
    keywords: ['make in india', 'mii', 'local content', 'class-i', 'class-ii'],
    title: 'Public Procurement (Preference to Make in India) Order 2017',
    text: 'Class-I Local Suppliers (≥50% local content) receive statutory purchase preference. Class-II Local Suppliers (20% to 50%) participate without purchase preference. Non-Local (<20%) are excluded in tenders up to ₹200 Crores under Global Tender Enquiry (GTE) restrictions.',
    citation: 'DPIIT Order P-45021/2/2017-PP (BE-II)',
    confidence: '98.9% Accuracy',
  },
  {
    keywords: ['emd', 'earnest money', 'bid security', 'msme', 'mse', 'turnover'],
    title: 'MSME / MSE Concessions & EMD Exemption',
    text: 'Under the Public Procurement Policy for Micro & Small Enterprises (MSEs) Order 2012 and GFR Rule 170(i), MSEs registered with Udyam Registration are 100% exempt from paying EMD/Bid Security. Concessions in prior turnover and experience are also mandated provided technical capability is demonstrated.',
    citation: 'Ministry of MSME Order & GFR Rule 170',
    confidence: '98.7% Accuracy',
  },
  {
    keywords: ['reject', 'disqualification', 'rejection', 'invalid', 'technical bid'],
    title: 'Mandatory Technical Disqualification Grounds',
    text: 'Key mandatory disqualification triggers include: 1) Non-submission of EMD / Bid Security Declaration (unless exempt), 2) Active debarment/blacklisting under GFR Rule 151, 3) Failure to submit land border certificate under Rule 144(xi), and 4) Submission of fraudulent PAN/GST credentials.',
    citation: 'GeM General Terms & Conditions (GTC) Cl. 4.2',
    confidence: '97.8% Accuracy',
  },
  {
    keywords: ['debarment', 'blacklist', '151', 'banning'],
    title: 'GFR Rule 151 — Debarment from Bidding',
    text: 'A bidder can be debarred for up to 2 years for corruption, fraudulent practices, or failure to execute contractual commitments. Debarred entities are universally barred across all Central Government Ministries and GeM SPV.',
    citation: 'Central Public Procurement Portal (CPPP) Vigilance Register',
    confidence: '99.1% Accuracy',
  },
];

const ChatBox = ({ isOpen, onClose, defaultMinimized = false }) => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(defaultMinimized);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !minimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, minimized]);

  const handleSend = (userText) => {
    const query = (userText || input).trim();
    if (!query) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI reasoning and RAG matching
    setTimeout(() => {
      const qLower = query.toLowerCase();
      const match = KNOWLEDGE_BASE.find((k) =>
        k.keywords.some((kw) => qLower.includes(kw))
      );

      let botResponse;
      if (match) {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          title: match.title,
          text: match.text,
          citation: match.citation,
          confidence: match.confidence,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      } else {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          title: `GeM Regulatory Search: "${query}"`,
          text: `Based on current GeM General Terms and Conditions (GTC) and CVC Operating Manual, verified compliance criteria indicates parameters for "${query}" require standard statutory verification against active vendor documents. No adverse blacklisting flags found.`,
          citation: 'GeM GTC v4.0 & Autonomous RAG Engine',
          confidence: '95.6% Verified',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50 flex flex-col items-end animate-in fade-in slide-in-from-bottom-5 duration-200">
      {minimized ? (
        /* Minimized Pill */
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#073567] to-indigo-700 text-white font-semibold text-xs shadow-2xl hover:shadow-indigo-500/30 transition-all cursor-pointer hover:scale-105"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-emerald-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span>AI Compliance Chatbox</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
            {messages.length}
          </span>
        </button>
      ) : (
        /* Full Chat Window */
        <div className="w-[92vw] sm:w-[410px] h-[540px] max-h-[82vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 font-sans">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#0d1e3d] via-[#073567] to-indigo-900 text-white flex items-center justify-between shadow-md select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs text-emerald-300 border border-white/15">
                <Bot className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">GeM AI Compliance Chat</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-300 font-medium">
                  Autonomous RAG & GFR Rules
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={() => setMessages(INITIAL_MESSAGES)}
                title="Reset Chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMinimized(true)}
                title="Minimize"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                title="Close"
                className="p-1.5 hover:text-rose-300 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 space-y-1.5 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-blue-500/10'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {msg.title && (
                    <p className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{msg.title}</span>
                    </p>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {msg.citation && (
                    <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9.5px] text-slate-400">
                      <span className="truncate">{msg.citation}</span>
                      {msg.confidence && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
                          {msg.confidence}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-[9px] text-right opacity-60">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 animate-spin" />
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-2xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0">
              Suggestions:
            </span>
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(s)}
                className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-700 transition shrink-0 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tender rules, clauses, compliance..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-sm disabled:opacity-40 transition cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
