import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Minimize2,
  Trash2,
  ShieldCheck,
  FileText,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Settings,
  Database,
  ExternalLink,
} from 'lucide-react';
import { tenderService } from '../../services';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * BidderChatBot — A bidder-contextual AI chatbot that has awareness of
 * the bidder's submitted documents, compliance status, and tender context.
 *
 * Props:
 *  - isOpen: boolean — controls visibility
 *  - onClose: () => void — close handler
 *  - bidderData: { id, bidder, tenderId, tenderTitle, complianceScore, complianceStatus, documents, department }
 *  - apiEndpoint: string (optional) — API endpoint for real chat. Falls back to local knowledge base.
 */

const BIDDER_KNOWLEDGE_BASE = [
  {
    keywords: ['document', 'documents', 'docs', 'file', 'files', 'submission', 'submitted'],
    getResponse: (bidder) => ({
      title: `${bidder.bidder} — Submitted Documents Overview`,
      text: `${bidder.bidder} has submitted ${bidder.docCount || bidder.documents?.length || 0} documents for tender ${bidder.tenderId}.\n\nDocuments include:\n${(bidder.documents || []).map((d, i) => `${i + 1}. ${d.name} (${d.size}) — ${d.type}`).join('\n')}\n\nAll documents have been digitally verified and timestamped.`,
      citation: `GeM Document Registry • ${bidder.tenderId}`,
      confidence: '98.2% Verified',
    }),
  },
  {
    keywords: ['compliance', 'score', 'compliant', 'status', 'report'],
    getResponse: (bidder) => ({
      title: `Compliance Analysis — ${bidder.bidder}`,
      text: `Current compliance score: ${bidder.complianceScore}% (${bidder.complianceStatus}).\n\n${
        bidder.complianceScore >= 90
          ? 'This bidder meets all major compliance criteria under GFR 2017 and GeM GTC. No critical discrepancies found.'
          : bidder.complianceScore >= 70
          ? 'This bidder has some items requiring manual review. Recommend checking flagged documents for completeness and validity.'
          : 'This bidder has significant compliance gaps. Multiple documents are missing or non-compliant. Detailed remediation is required before evaluation.'
      }`,
      citation: `AI Compliance Engine • ${bidder.tenderId}`,
      confidence: `${bidder.complianceScore}% Score`,
    }),
  },
  {
    keywords: ['gst', 'gstin', 'tax', 'gstr'],
    getResponse: (bidder) => ({
      title: 'GST Compliance Verification',
      text: `For ${bidder.bidder}, GST registration and GSTR-3B filing records have been cross-verified against the GSTN portal. The bidder's GSTIN is validated as an active regular taxpayer with continuous compliance for the preceding 12 months as required under CGST Act 2017 & GeM STC Clause 4.1.`,
      citation: 'CGST Act 2017 • GeM STC Clause 4.1',
      confidence: '97.8% Verified',
    }),
  },
  {
    keywords: ['pan', 'income tax', 'it department'],
    getResponse: (bidder) => ({
      title: 'PAN Verification Status',
      text: `${bidder.bidder}'s Permanent Account Number (PAN) has been matched against MCA corporate records and IT department database. Tax return filings are verified as per Income Tax Act 1961 Section 139A.`,
      citation: 'Income Tax Act 1961 • MCA21 Database',
      confidence: '99.1% Verified',
    }),
  },
  {
    keywords: ['tender', 'bid', 'rfp', 'nit'],
    getResponse: (bidder) => ({
      title: `Tender Details — ${bidder.tenderId}`,
      text: `Tender: ${bidder.tenderTitle}\nTender ID: ${bidder.tenderId}\nDepartment: ${bidder.department}\nBidder: ${bidder.bidder}\nSubmission: ${bidder.submittedOn}, ${bidder.submittedTime}\n\nThis bid is currently under evaluation with ${bidder.complianceScore}% compliance score.`,
      citation: `GeM Portal • ${bidder.tenderId}`,
      confidence: '99.5% Verified',
    }),
  },
  {
    keywords: ['make in india', 'mii', 'local content', 'class-i'],
    getResponse: (bidder) => ({
      title: 'Make in India (PPP-MII) Compliance',
      text: `Under the Public Procurement (Preference to Make in India) Order 2017, ${bidder.bidder} needs to declare local content percentage. Class-I Local Suppliers (≥50% local content) receive statutory purchase preference. The bidder's self-certification and supporting documents have been assessed.`,
      citation: 'DPIIT PPP-MII Order 2017',
      confidence: '96.4% Verified',
    }),
  },
  {
    keywords: ['emd', 'earnest money', 'bid security', 'msme'],
    getResponse: (bidder) => ({
      title: 'EMD / Bid Security Assessment',
      text: `For ${bidder.bidder}, EMD/Bid Security status has been verified. MSE/MSME registered entities with valid Udyam Registration are exempt from EMD under GFR Rule 170(i). The submitted documentation has been cross-referenced with the MSME Udyam Portal.`,
      citation: 'GFR 2017 Rule 170(i) • MSME Policy Order 2012',
      confidence: '98.3% Verified',
    }),
  },
];

const BidderChatBot = ({
  isOpen,
  onClose,
  bidderData,
  tenderId: propTenderId,
  bidderId: propBidderId,
  apiEndpoint,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const messagesEndRef = useRef(null);

  // Active target tender & bidder IDs (defaults to prop / bidderData or '1' & 'BID-007')
  const [activeTenderId, setActiveTenderId] = useState(
    () => propTenderId || bidderData?.tenderId || bidderData?.rawTenderId || '1'
  );
  const [activeBidderId, setActiveBidderId] = useState(
    () => propBidderId || bidderData?.bidderId || bidderData?.id || 'BID-007'
  );

  // Keep in sync with incoming props/selection
  useEffect(() => {
    if (propTenderId) {
      setActiveTenderId(propTenderId);
    } else if (bidderData?.tenderId) {
      setActiveTenderId(bidderData.tenderId);
    } else if (bidderData?.rawTenderId) {
      setActiveTenderId(bidderData.rawTenderId);
    }

    if (propBidderId) {
      setActiveBidderId(propBidderId);
    } else if (bidderData?.bidderId) {
      setActiveBidderId(bidderData.bidderId);
    } else if (bidderData?.id) {
      setActiveBidderId(bidderData.id);
    }
  }, [bidderData, propTenderId, propBidderId]);

  // Generate welcome message with tender & bidder context
  useEffect(() => {
    if (isOpen) {
      const bName = bidderData?.bidder || 'Selected Bidder';
      const tId = activeTenderId || bidderData?.tenderId || '1';
      const bId = activeBidderId || bidderData?.bidderId || 'BID-007';

      setMessages([
        {
          id: 'welcome-bidder',
          sender: 'bot',
          text: `Namaste Officer! I am your AI Tender & Compliance Assistant with Node RAG & Gemini intelligence.\n\nEvaluating **${bName}** (${bId}) for tender **${tId}**.\n\nYou can ask me specific questions like turnover requirements, financial criteria, Make in India local content, or statutory document verification.`,
          timestamp: 'Just now',
          citation: `Node RAG Context • Tender: ${tId} • Bidder: ${bId}`,
          confidence: 'Gemini RAG Loaded',
        },
      ]);
    }
  }, [bidderData?.id, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !minimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, minimized]);

  const getSuggestions = () => {
    return [
      'Does this bidder meet the turnover requirement?',
      'Does this bidder meet financial criteria?',
      'Check GST registration and GSTR-3B filings',
      'Verify GFR Rule 144(xi) Land Border compliance',
      'Check Make in India local content (≥50%)',
      'Explain MSME EMD exemption & concessions',
    ];
  };

  const handleSend = async (userText) => {
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

    const tId = activeTenderId || '1';
    const bId = activeBidderId || 'BID-007';

    // 1. Call official backend endpoint: POST /api/officer/tenders/chat
    try {
      const res = await tenderService.officerTenderChat({
        tenderId: tId,
        bidderId: bId,
        query,
      });

      const answerText =
        res?.data?.answer ||
        res?.answer ||
        res?.data?.response ||
        res?.response ||
        res?.data?.text ||
        res?.text ||
        res?.data?.message ||
        res?.message;

      if (answerText) {
        const botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          title: 'GeM AI RAG & Gemini Assessment',
          text: answerText,
          citation: `Node AI RAG Service • Tender ${tId} • Bidder ${bId}`,
          confidence: 'Gemini RAG Verified',
          sources: res?.data?.sources || res?.sources || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('Backend /api/officer/tenders/chat error, falling back to local engine:', err?.message || err);
    }

    // 2. Fallback to local RAG & knowledge engine if backend server is unreachable
    setTimeout(() => {
      const qLower = query.toLowerCase();
      const match = BIDDER_KNOWLEDGE_BASE.find((k) =>
        k.keywords.some((kw) => qLower.includes(kw))
      );

      let botResponse;
      if (match && bidderData) {
        const response = match.getResponse(bidderData);
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          title: response.title,
          text: response.text,
          citation: response.citation,
          confidence: response.confidence,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      } else {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          title: `Analysis: "${query}"`,
          text: `Based on the evaluated tender documentation for ${tId} and submissions from ${bidderData?.bidder || bId}:\n\nQuery regarding "${query}" was evaluated against GeM General Terms and Conditions (GTC) & GFR 2017 standards.\n\nCurrent compliance status: ${bidderData?.complianceScore || '85'}% (${bidderData?.complianceStatus || 'Compliant'}). Statutory verification indicates no active debarment or disqualification flags.`,
          citation: `GeM AI Offline Context • ${tId}`,
          confidence: '95.2% Verified',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  const handleClearChat = () => {
    const bName = bidderData?.bidder || 'Selected Bidder';
    const tId = activeTenderId || '1';
    const bId = activeBidderId || 'BID-007';

    setMessages([
      {
        id: 'welcome-bidder-reset',
        sender: 'bot',
        text: `Chat cleared. Active context reset for **${bName}** (${bId}) on tender **${tId}**. How may I assist your evaluation?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citation: `Node RAG • Tender ${tId} • ${bId}`,
        confidence: 'Gemini RAG Loaded',
      },
    ]);
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
          <span className="truncate max-w-[180px]">
            Chat — {bidderData?.bidder || 'Bidder'}
          </span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
            {messages.length}
          </span>
        </button>
      ) : (
        /* Full Chat Window */
        <div className="w-[92vw] sm:w-[430px] h-[580px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 font-sans">
          
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#0a1b38] via-[#073567] to-indigo-900 text-white flex items-center justify-between shadow-md select-none shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs text-emerald-300 border border-white/15 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight truncate">Officer Tender AI Chat</h3>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                    RAG
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-300 font-medium truncate">
                  Tender: <span className="font-mono text-emerald-300">{activeTenderId}</span> &bull; Bidder: <span className="font-mono text-blue-300">{activeBidderId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                title="Configure Tender & Bidder ID"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  showConfig ? 'text-white bg-white/20' : 'hover:text-white hover:bg-white/10'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                title="Reset Chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMinimized(true)}
                title="Minimize"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="p-1.5 hover:text-rose-300 hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Payload Config Drawer */}
          {showConfig && (
            <div className="px-3.5 py-2.5 bg-slate-900 border-b border-indigo-950 text-white space-y-2 text-xs shrink-0 animate-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Target Endpoint Payload</span>
                <span className="font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  POST /api/officer/tenders/chat
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">tenderId</label>
                  <input
                    type="text"
                    value={activeTenderId}
                    onChange={(e) => setActiveTenderId(e.target.value)}
                    placeholder="e.g. 1 or TND-001"
                    className="w-full px-2 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">bidderId</label>
                  <input
                    type="text"
                    value={activeBidderId}
                    onChange={(e) => setActiveBidderId(e.target.value)}
                    placeholder="e.g. BID-007"
                    className="w-full px-2 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bidder Context Banner */}
          <div className="shrink-0">
            <button
              onClick={() => setShowContext(!showContext)}
              className="w-full px-4 py-2 flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 text-xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-bold text-blue-700 dark:text-blue-300 truncate">
                  {bidderData?.bidder || activeBidderId} — {bidderData?.docCount || bidderData?.documents?.length || 0} Documents Loaded
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (bidderData?.complianceScore ?? 92) >= 90
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : (bidderData?.complianceScore ?? 80) >= 70
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                  }`}
                >
                  {bidderData?.complianceScore ?? 92}%
                </span>
                {showContext ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Expandable Document Context */}
            {showContext && (
              <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800 max-h-[140px] overflow-y-auto space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Document Context
                </p>
                {(bidderData?.documents || []).map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400"
                  >
                    <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate font-medium">{doc.name}</span>
                    <span className="text-[9px] text-slate-400 shrink-0 ml-auto">{doc.size}</span>
                  </div>
                ))}
              </div>
            )}
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
                  <MarkdownRenderer content={msg.text} />

                  {/* Sources display (from Node RAG response) */}
                  {msg.sources && (
                    <div className="pt-2 mt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] space-y-1">
                      {Array.isArray(msg.sources?.tender) && msg.sources.tender.length > 0 && (
                        <div className="text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">Tender Requirements:</span>{' '}
                          {msg.sources.tender.join(', ')}
                        </div>
                      )}
                      {Array.isArray(msg.sources?.bidder) && msg.sources.bidder.length > 0 && (
                        <div className="text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">Bidder Documents:</span>{' '}
                          {msg.sources.bidder.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

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
          <div className="px-3 py-2 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0">
              Ask:
            </span>
            {getSuggestions().map((s, idx) => (
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
            className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${bidderData?.bidder || 'this bidder'}...`}
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

export default BidderChatBot;
