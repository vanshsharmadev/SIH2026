import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, Square, X, Keyboard, Eye, CheckCircle2, Info } from 'lucide-react';

const ScreenReaderModal = ({ isOpen, onClose }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Close on Escape key & lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleStopSpeech();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Clean up speech synthesis when closing or unmounting
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakOverview = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech Synthesis is not supported in your browser.');
      return;
    }

    window.speechSynthesis.cancel();

    const textToRead = 
      "Welcome to GeM Compliflix, the official AI-powered Public Procurement Compliance Platform of the Government of India. " +
      "This portal assists government buyers and vendors in analyzing tender documents, ensuring compliance with general financial rules and GeM guidelines. " +
      "Use Alt plus M to skip to main content, or press Tab to navigate through interactive elements.";

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none overflow-y-auto"
      onClick={() => {
        handleStopSpeech();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-modal-title"
    >
      <div
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#073567] dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 id="accessibility-modal-title" className="text-base font-bold leading-tight text-white">
                Screen Reader & Accessibility
              </h3>
              <p className="text-[11px] text-blue-200">
                GIGW 3.0 & WCAG 2.1 (Level AA) Compliant
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleStopSpeech();
              onClose();
            }}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          
          {/* Audio Overview Tool */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 dark:text-white block text-xs sm:text-sm">
                Voice Reader (Text-to-Speech)
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 block">
                Listen to the official audio overview of this page
              </span>
            </div>
            {isSpeaking ? (
              <button
                onClick={handleStopSpeech}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={handleSpeakOverview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#073567] hover:bg-[#05284f] text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen Now</span>
              </button>
            )}
          </div>

          {/* Compatible Screen Readers */}
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Supported Screen Reading Softwares
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-slate-100">NonVisual Desktop Access (NVDA)</span>
                <span className="block text-slate-500 dark:text-slate-400 text-[10px]">Windows (Free)</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-slate-100">JAWS (Job Access With Speech)</span>
                <span className="block text-slate-500 dark:text-slate-400 text-[10px]">Windows (Commercial)</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Windows Narrator</span>
                <span className="block text-slate-500 dark:text-slate-400 text-[10px]">Windows (Built-in)</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Apple VoiceOver / TalkBack</span>
                <span className="block text-slate-500 dark:text-slate-400 text-[10px]">macOS / iOS / Android</span>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Guide */}
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2 flex items-center gap-1.5 text-xs">
              <Keyboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Keyboard Navigation Shortcuts
            </span>
            <div className="space-y-1 text-[11px] sm:text-xs">
              <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-300">Skip directly to main content</span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono text-[10px] text-slate-800 dark:text-slate-200 shadow-2xs">Alt + M</kbd>
              </div>
              <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-300">Close modal / Cancel speech</span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono text-[10px] text-slate-800 dark:text-slate-200 shadow-2xs">Esc</kbd>
              </div>
              <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-300">Navigate forward / backward</span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono text-[10px] text-slate-800 dark:text-slate-200 shadow-2xs">Tab / Shift + Tab</kbd>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
            <Info className="w-3 h-3 text-blue-500 shrink-0" />
            <span>Meets Section 508 and GIGW 3.0 Standards</span>
          </div>
          <button
            onClick={() => {
              handleStopSpeech();
              onClose();
            }}
            className="px-4 py-1.5 bg-[#073567] hover:bg-[#05284f] text-white font-semibold text-xs rounded-lg shadow-2xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ScreenReaderModal;
