import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Minimize2,
  Maximize2,
  Trash2,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Copy,
  Check,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
} from 'lucide-react';
import { askBidderTenderAI } from '../../services';
import { normalizeTenderId, findTenderById } from '../../utils/tenderIdUtils';
import MarkdownRenderer from '../common/MarkdownRenderer';

let messageSeq = 0;
const createMsgId = (prefix) => `${prefix}_${++messageSeq}`;

const SUGGESTED_QUESTIONS = [
  'What are the eligibility criteria?',
  'What documents are required?',
  'What is the EMD amount?',
  'What is the last date for submission?',
  'Explain the payment milestone schedule.',
  'What is the estimated tender value?',
  'What are the technical requirements?',
  'What are the experience requirements?',
  'What are the penalties?',
  'Summarize this tender.',
  'What are the important compliance requirements?',
];

/**
 * TenderChatbot
 * Standalone Full-Screen AI Tender Assistant for Bidders.
 * Queries RAG backend: POST /api/ai/bidder-chat/ask
 * Dynamically scoped to active tenderId with grounded 4-tier fallback.
 */
export const TenderChatbot = ({
  tenderId,
  tenderRef,
  tenderTitle,
  tenderDepartment,
  tenderValue,
  tenderDeadline,
  tender,
  isOpen = true,
  onClose,
  isEmbedded = false,
  defaultFullscreen = false,
}) => {
  // Normalize tender identifier
  const activeTenderId = normalizeTenderId(tenderId || tender?.id || tender?.referenceNo || tender?.tenderId);
  const displayRef = tenderRef || activeTenderId || 'TND';

  // Locate active tender strictly (never bleed another tender)
  const activeTender = tender || findTenderById(
    JSON.parse(localStorage.getItem('gem_created_tenders') || '[]'),
    activeTenderId
  );

  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);
  const [expandedSources, setExpandedSources] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Format initial welcome message for this specific tender
  const createWelcomeMessage = useCallback(
    (tId) => ({
      id: createMsgId(`welcome_${tId || 'init'}`),
      role: 'assistant',
      content: `Hello! I am your **AI Tender Assistant** for **${displayRef}**${
        tenderTitle ? ` — *"${tenderTitle}"*` : ''
      }.\n\nI have indexed official tender documents, technical specifications, BOQ schedules, and GFR 2017 compliance guidelines for this procurement.\n\nAsk any question regarding **eligibility criteria**, **required documents**, **EMD / bid security**, **payment milestones**, or **submission requirements**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isWelcome: true,
    }),
    [displayRef, tenderTitle]
  );

  const [messages, setMessages] = useState(() => [createWelcomeMessage(activeTenderId)]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const currentTenderIdRef = useRef(activeTenderId);

  // Reset conversation when tenderId changes
  useEffect(() => {
    if (activeTenderId !== currentTenderIdRef.current) {
      currentTenderIdRef.current = activeTenderId;
      setMessages([createWelcomeMessage(activeTenderId)]);
      setInput('');
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }, [activeTenderId, createWelcomeMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen, isFullscreen]);

  // Lock body scroll when open in modal mode
  useEffect(() => {
    if (isOpen && !isEmbedded) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isEmbedded]);

  // Handle ESC key to exit fullscreen or close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (isOpen && onClose && !isEmbedded) {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isFullscreen, onClose, isEmbedded]);

  const toggleSourceExpand = (msgId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleCopy = (text, idx) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: createMsgId('cleared'),
        role: 'assistant',
        content: `Chat history cleared. Active context is set to tender **${displayRef}** (ID: \`${activeTenderId}\`). What would you like to know?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isWelcome: true,
      },
    ]);
  };

  const handleSend = async (userText) => {
    const query = (userText || input).trim();
    if (!query) return;

    // Prevent duplicate API calls
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    setIsLoading(true);

    const userMessage = {
      id: createMsgId('user'),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await askBidderTenderAI({
        tenderId: activeTenderId,
        query,
        tender: activeTender,
      });

      // Extract the answer based on contract
      const answerText =
        res?.answer ||
        res?.data?.answer ||
        res?.response ||
        res?.data?.response ||
        res?.message ||
        res?.data?.message ||
        res?.text ||
        res?.data?.text ||
        (typeof res === 'string' ? res : null);

      const sources = res?.sources || res?.data?.sources || null;
      const confidence = res?.confidenceScore || (res?.isGroundedFallback ? 'Grounded Specification' : 'Verified RAG');

      if (answerText && typeof answerText === 'string' && answerText.trim()) {
        const botMessage = {
          id: createMsgId('bot'),
          role: 'assistant',
          content: answerText.trim(),
          sources,
          confidence,
          isGroundedFallback: res?.isGroundedFallback || false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Clean no-answer response without technical errors
        const fallbackMsg = {
          id: createMsgId('bot_warn'),
          role: 'assistant',
          content: `I couldn't find this information in the selected tender specifications. Please refer to the official RFP document or check if addenda have been published.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err) {
      console.warn('Bidder Tender AI Notice:', err?.message || err);

      // Clean message adhering to UX requirements (no stack traces, no JSON)
      const botErrorMessage = {
        id: createMsgId('bot_err'),
        role: 'assistant',
        content: `I couldn't find this information in the selected tender. Please verify the tender requirements or consult the published RFP.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botErrorMessage]);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  if (!isOpen && !isEmbedded) return null;

  const chatContent = (
    <div
      className={
        isEmbedded
          ? 'w-full h-full flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs text-slate-800 dark:text-slate-100 font-sans'
          : isFullscreen
          ? 'fixed inset-0 z-[99999] w-full h-full bg-white dark:bg-slate-900 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-200'
          : 'w-full max-w-5xl h-[92vh] max-h-[94vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-200'
      }
      role="dialog"
      aria-modal="true"
      aria-label={`AI Tender Assistant for ${displayRef}`}
    >
      {/* ═══ 1. TOP HEADER (Government Navy / Indigo Gradient) ═══ */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-[#073567] via-[#09284d] to-indigo-950 text-white flex items-center justify-between shadow-md select-none shrink-0 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-emerald-300 border border-white/20 shadow-xs shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                <span>AI Tender Assistant</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active
              </span>
              <span className="hidden sm:inline-block font-mono text-xs px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10">
                {displayRef}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
              Instant Q&amp;A grounded in official tender specifications &amp; GFR 2017
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1.5 text-slate-300 shrink-0">
          {/* Full Screen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Expand to Full Screen'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition cursor-pointer text-xs font-semibold"
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-emerald-300" />
                <span className="hidden md:inline">Restore</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden md:inline">Full Screen</span>
              </>
            )}
          </button>

          {/* Reset Conversation */}
          <button
            type="button"
            onClick={handleClearChat}
            title="Reset Conversation"
            className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            aria-label="Reset Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close AI Assistant (Esc)"
              className="p-1.5 hover:text-rose-300 hover:bg-white/15 rounded-lg transition cursor-pointer ml-1"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ═══ 2. TENDER CONTEXT BANNER ═══ */}
      <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold text-slate-600 dark:text-slate-300 shrink-0">Tender:</span>
          <span className="font-bold text-slate-900 dark:text-white truncate max-w-md">
            {tenderTitle || displayRef}
          </span>
          <span className="font-mono text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-200 dark:border-blue-900 shrink-0">
            ID: {activeTenderId}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          {tenderDepartment && (
            <span className="hidden md:flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[180px]">{tenderDepartment}</span>
            </span>
          )}
          {tenderValue && (
            <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{tenderValue}</span>
            </span>
          )}
          {tenderDeadline && (
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{tenderDeadline}</span>
            </span>
          )}
        </div>
      </div>

      {/* ═══ 3. SUGGESTED QUESTIONS CHIPS BAR ═══ */}
      <div className="px-5 py-2 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Suggested:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0 disabled:opacity-50 whitespace-nowrap hover:scale-[1.02] shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ═══ 4. CONVERSATION MESSAGES STREAM ═══ */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60 dark:bg-slate-950/50 text-xs sm:text-sm">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#073567] to-indigo-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                    <Bot className="w-4 h-4 text-emerald-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 space-y-2.5 ${
                    isUser
                      ? 'bg-gradient-to-tr from-[#073567] to-indigo-700 text-white rounded-tr-xs shadow-md'
                      : msg.isError
                      ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-tl-xs shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-sm'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between gap-3 text-[11px] pb-1 border-b border-black/5 dark:border-white/5 select-none">
                    <span className="font-bold flex items-center gap-1.5">
                      {isUser ? (
                        'YOU'
                      ) : (
                        <>
                          <span>AI Tender Assistant</span>
                          {msg.confidence && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold text-[10px]">
                              {msg.confidence}
                            </span>
                          )}
                        </>
                      )}
                    </span>
                    <span className="opacity-70">{msg.timestamp}</span>
                  </div>

                  {/* Message Content */}
                  <div className="leading-relaxed break-words">
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>

                  {/* Sources / Document Citations */}
                  {!isUser && msg.sources && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleSourceExpand(msg.id)}
                        className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          {expandedSources[msg.id] ? 'Hide Document Sources' : 'View Cited Tender Sources'}
                        </span>
                        {expandedSources[msg.id] ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>

                      {expandedSources[msg.id] && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                          {Array.isArray(msg.sources) ? (
                            <div className="space-y-2">
                              {msg.sources.map((src, sIdx) => {
                                const doc = typeof src === 'object' ? src.document || src.name || 'Tender Specifications Document' : String(src);
                                const section = typeof src === 'object' ? src.section || 'General Terms & Conditions' : null;
                                const page = typeof src === 'object' && src.page ? `Page ${src.page}` : null;
                                return (
                                  <div key={sIdx} className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                                    <FileText className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-semibold text-slate-900 dark:text-white truncate">{doc}</div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 mt-0.5">
                                        {section && <span>Section: <strong>{section}</strong></span>}
                                        {page && <span>• {page}</span>}
                                        <span>• <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified Grounded Context</span></span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : typeof msg.sources === 'object' ? (
                            <div className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                              <FileText className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {msg.sources.document || msg.sources.name || 'Tender Specification RFP'}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Verified Tender Document
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="font-mono text-[11px]">{String(msg.sources)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Footer Copy Action */}
                  {!isUser && !msg.isError && (
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, index)}
                        className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                        title="Copy Response"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#073567] to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-tl-xs shadow-sm space-y-2 text-xs">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing tender requirements...</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Retrieving specifications for Tender #{activeTenderId} and synthesizing answer...
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ═══ 5. BOTTOM INPUT BAR ═══ */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2.5 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition shadow-inner"
          >
            <div className="flex-1 min-w-0 pl-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={`Ask anything about ${displayRef} (e.g. "What is the EMD amount?", "Explain payment milestones")...`}
                className="w-full resize-none bg-transparent border-0 focus:outline-hidden text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 py-1.5 max-h-32"
                aria-label="Ask Question about Tender"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white flex items-center justify-center shadow-md disabled:opacity-40 transition cursor-pointer shrink-0 hover:scale-105"
              title="Send Question (Enter)"
              aria-label="Send Question"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-2 pt-2">
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Enter ↵</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Shift+Enter</kbd> for newline
            </span>
            <span className="hidden sm:inline">
              Grounded exclusively in official tender documents
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // When embedded (e.g. right column), render directly
  if (isEmbedded) {
    return chatContent;
  }

  // When standalone modal overlay, render via createPortal to document.body
  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
      {chatContent}
    </div>,
    document.body
  );
};

export default TenderChatbot;
