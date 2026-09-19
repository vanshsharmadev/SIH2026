import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  FileText,
  Download,
  CheckCircle2,
  Award,
  Lock,
  UploadCloud,
  RefreshCw,
  AlertTriangle,
  Database,
  Check,
  ArrowRight,
  Bot,
  Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { isOfficerUser } from '../../utils/roleUtils';
import { isTenderClosed } from '../../utils';
import { documentService } from '../../services';
import TenderChatbot from './TenderChatbot';
import QcbsBiddersRanking from './QcbsBiddersRanking';

const COMPLIANCE_DOC_TYPES = [
  { id: 'gst', value: 'gst', label: 'GST Registration Certificate (REG-06)', required: true },
  { id: 'pan', value: 'pan', label: 'Permanent Account Number (PAN) Card', required: true },
  { id: 'msme', value: 'msme', label: 'Udyam Registration Certificate (MSME)', required: false },
  { id: 'gfr_144', value: 'gfr_144', label: 'GFR Rule 144(xi) Land Border Declaration', required: true },
  { id: 'mii_declaration', value: 'mii_declaration', label: 'Make in India (PPP-MII) Declaration', required: true },
  { id: 'technical', value: 'technical', label: 'Technical Proposal / Compliance Matrix', required: true },
  { id: 'financial', value: 'financial', label: 'Audited Balance Sheet & Profit/Loss', required: false },
  { id: 'experience', value: 'experience', label: 'Past Experience & Work Completion', required: false },
];

const TenderDetailModal = ({ tender, onClose, initialTab = 'overview' }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isOfficer = Boolean(isAuthenticated && isOfficerUser(user));
  const isClosed = isTenderClosed(tender);

  // Tab state: 'overview' vs 'compliance' vs 'qcbs'
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Compliance Document Upload & AI Processing States
  const [complianceDocs, setComplianceDocs] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState('gst');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [nonBlockingNotice, setNonBlockingNotice] = useState(null);
  const fileInputRef = useRef(null);

  // Duplicate processing protection (in-flight set and completed set)
  const processingIdsRef = useRef(new Set());
  const processedIdsRef = useRef(new Set());

  useEffect(() => {
    if (!tender) return;

    // Prevent body background scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Explicitly pause Lenis smooth scroll so background window never scrolls
    if (window.lenis) {
      window.lenis.stop();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);

      // Resume Lenis smooth scroll when modal closes
      if (window.lenis) {
        window.lenis.start();
      }
    };
  }, [tender, onClose]);

  // Load existing compliance documents on open
  useEffect(() => {
    if (!tender) return;
    let isMounted = true;
    const fetchTenderDocs = async () => {
      try {
        const tenderRef = tender.id || tender.referenceNo;
        const docs = await documentService.getDocuments();
        if (Array.isArray(docs) && isMounted) {
          const relevant = docs.filter(
            (d) => String(d.tenderId) === String(tenderRef) || !d.tenderId
          );
          if (relevant.length > 0) {
            setComplianceDocs(
              relevant.map((d) => ({
                id: d.id || d.documentId,
                tenderId: tenderRef,
                bidderId: d.bidderId || 'bidder-current',
                documentId: d.id || d.documentId,
                fileName: d.fileName || d.name || 'document.pdf',
                documentType: d.documentType || 'generic',
                pdfUrl: d.fileUrl,
                publicId: d.cloudinaryPublicId,
                fileSize: d.fileSize || 1024 * 1024,
                uploadedAt: d.uploadedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                aiStatus: d.aiStatus || 'COMPLETED',
                isAiProcessed: true,
              }))
            );
          }
        }
      } catch (e) {
        console.warn('Notice loading documents:', e);
      }
    };
    fetchTenderDocs();
    return () => {
      isMounted = false;
    };
  }, [tender]);

  if (!tender) return null;

  // File validation
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadError(null);
      setNonBlockingNotice(null);

      const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(ext)) {
        setUploadError('Please select a valid document format (.pdf, .jpg, .jpeg, .png)');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setUploadError('File size exceeds the 50MB limit');
        return;
      }
      setSelectedFile(file);
    }
  };

  /**
   * Expected Sequence Implementation:
   * Bidder opens Tender -> Tender Details -> Compliance Documents -> Bidder selects document ->
   * Document uploaded successfully -> Cloudinary returns secure URL/public ID ->
   * Document is successfully saved/created in backend -> Get/confirm documentId ->
   * POST /api/ai/bidder/process -> AI/RAG processing -> Chunking -> Embedding -> pgvector
   */
  const handleUploadComplianceDoc = async () => {
    if (!selectedFile) {
      setUploadError('Please select a document file to upload');
      return;
    }
    if (uploading) return;

    setUploading(true);
    setUploadError(null);
    setNonBlockingNotice(null);
    setUploadProgress(15);
    setStageMessage('Uploading document securely...');

    let savedDoc;

    try {
      // Step 1: Upload to Cloudinary & save document in backend
      const uploadRes = await documentService.uploadDocument(
        selectedFile,
        selectedDocType,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 45) / progressEvent.total);
            setUploadProgress(Math.max(15, percent));
          }
        }
      );

      const data = uploadRes?.data || uploadRes;
      if (!data || (!data.id && !data.documentId)) {
        throw new Error('Document persistence step failed. Backend did not return a valid document ID.');
      }

      savedDoc = data;
      setUploadProgress(60);
      setStageMessage('Document saved. Analyzing document content and evaluating compliance...');
    } catch (err) {
      // Case 1 (Cloudinary upload failed) or Case 2 (Document save API failed)
      // Do NOT call AI process API
      setUploading(false);
      setUploadProgress(0);
      setUploadError(err.message || 'Upload failed. The document could not be saved.');
      return;
    }

    // Step 2: Confirm documentId, Cloudinary secure URL, and Cloudinary public ID
    const currentTenderId = tender.id || tender.referenceNo;
    const currentBidderId = savedDoc.bidderId || user?.id || (user?.userId ? user.userId : 201);
    const createdDocumentId = savedDoc.id || savedDoc.documentId;
    const actualDocumentType = savedDoc.documentType || selectedDocType;
    const cloudinarySecureUrl = savedDoc.fileUrl;
    const cloudinaryPublicId = savedDoc.cloudinaryPublicId || `bidders/${currentBidderId}/${actualDocumentType}`;

    const docRecord = {
      id: createdDocumentId,
      tenderId: currentTenderId,
      bidderId: currentBidderId,
      documentId: createdDocumentId,
      fileName: selectedFile.name,
      documentType: actualDocumentType,
      pdfUrl: cloudinarySecureUrl,
      publicId: cloudinaryPublicId,
      fileSize: selectedFile.size,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      aiStatus: 'PROCESSING', // 'PROCESSING' | 'COMPLETED' | 'FAILED'
    };

    setComplianceDocs((prev) => [docRecord, ...prev.filter((d) => d.id !== createdDocumentId)]);

    // Step 3: Trigger POST /api/ai/bidder/process
    await executeAiProcess(docRecord);

    // Reset file picker
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
  };

  /**
   * Executes POST /api/ai/bidder/process with duplicate protection and Case 3 handling.
   */
  const executeAiProcess = async (docRecord) => {
    const docId = docRecord.documentId || docRecord.id;

    // Duplicate Processing Protection
    if (processingIdsRef.current.has(docId)) {
      return;
    }
    if (processedIdsRef.current.has(docId)) {
      return;
    }

    processingIdsRef.current.add(docId);

    const aiPayload = {
      tenderId: String(docRecord.tenderId),
      bidderId: String(docRecord.bidderId),
      documentId: String(docId),
      documentType: String(docRecord.documentType),
      pdfUrl: String(docRecord.pdfUrl),
      publicId: String(docRecord.publicId),
    };

    try {
      setUploadProgress(80);
      setStageMessage('Processing document and verifying compliance...');

      await documentService.processBidderDocument(aiPayload);

      // Case 4: Everything succeeds
      processedIdsRef.current.add(docId);
      processingIdsRef.current.delete(docId);
      setUploadProgress(100);
      setStageMessage('Document verification and compliance analysis complete.');

      setComplianceDocs((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, aiStatus: 'COMPLETED', isAiProcessed: true } : d
        )
      );
    } catch {
      // Case 3: Document saved successfully but AI process API failed
      // The document itself remains saved. Show non-blocking error/status with retry.
      processingIdsRef.current.delete(docId);

      setComplianceDocs((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, aiStatus: 'FAILED', isAiProcessed: false } : d
        )
      );

      setNonBlockingNotice({
        message: 'Document uploaded successfully, but AI processing could not be completed. Please retry.',
        docRecord,
      });
    }
  };

  const handleRetryAi = async (docRecord) => {
    setNonBlockingNotice(null);
    setStageMessage('Retrying compliance analysis...');
    await executeAiProcess(docRecord);
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150 overscroll-contain"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
    >
      <div
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[88vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
      >
        {/* Header */}
        <div className="shrink-0 bg-[#073567] dark:bg-slate-950 px-5 sm:px-6 py-4 text-white flex items-start justify-between gap-4 border-b border-blue-900/30 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-md bg-white/15 text-blue-100 font-mono text-xs font-bold tracking-wider">
                {tender.referenceNo}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                  tender.status === 'Closing Soon'
                    ? 'bg-amber-500'
                    : tender.status === 'Under Evaluation'
                    ? 'bg-purple-600'
                    : 'bg-emerald-600'
                }`}
              >
                {tender.status}
              </span>
              <span className="text-[11px] text-blue-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Ends in {tender.daysLeft}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold leading-snug text-white">
              {tender.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsAiChatOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-emerald-500/25 transition-all cursor-pointer hover:scale-105"
              title="Ask AI Tender Assistant (Opens Full Screen)"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-200" />
              <span>Ask AI</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation: Overview vs Compliance Documents */}
        <div className="shrink-0 flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 px-5 sm:px-6 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white/60 dark:bg-slate-800/40'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tender Overview & Scope</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'compliance'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white/60 dark:bg-slate-800/40'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compliance Documents</span>
            {complianceDocs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                {complianceDocs.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qcbs')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'qcbs'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white/60 dark:bg-slate-800/40'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Trophy className={`w-3.5 h-3.5 ${activeTab === 'qcbs' ? 'text-amber-500 fill-amber-500/20' : 'text-amber-500/80'}`} />
            <span>Top Evaluated Bidders (QCBS Ranking)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300/60 dark:border-amber-700/60">
              Top 10 &bull; 70:30
            </span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          className="flex-1 min-h-0 p-5 sm:p-6 space-y-5 overflow-y-auto overscroll-contain text-xs sm:text-sm"
          data-lenis-prevent="true"
        >
          {activeTab === 'overview' ? (
            <>
              {/* Key Facts Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">
                    Estimated Value
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {tender.value}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">
                    EMD Amount
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200">
                    {tender.emdAmount?.split(' ')[0]} {tender.emdAmount?.split(' ')[1] || ''}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">
                    Published Date
                  </span>
                  <span className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                    {tender.published}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">
                    Closing Deadline
                  </span>
                  <span className="text-xs sm:text-[13px] font-semibold text-rose-600 dark:text-rose-400">
                    {tender.closes}
                  </span>
                </div>
              </div>

              {/* Ministry & Location Information */}
              <div className="space-y-2 p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {tender.ministry}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs">
                      {tender.department}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-blue-100/80 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Location: {tender.location}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Scope of Work & Description
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  {tender.description}
                </p>
              </div>

              {/* Compliance & Eligibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>AI Compliance Rating</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {tender.complianceScore}%
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Verified against GFR 2017 & GeM Norms
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${tender.complianceScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-400 mb-1">
                    <Award className="w-4 h-4" />
                    <span>Make In India Local Content</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                    {tender.minLocalContent}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Bid Type: {tender.bidType}
                  </span>
                </div>
              </div>

              {/* Quick AI Verification Banner */}
              {!isOfficer ? (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#073567] dark:bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Verify Bid Qualification for {tender.referenceNo}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        Pre-screen your compliance documents against this tender's GFR 2017 &amp; MII local content rules.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsAiChatOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-md transition shrink-0 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Ask AI Assistant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('compliance')}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#073567] hover:bg-[#05284f] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition shrink-0 cursor-pointer"
                    >
                      <span>Upload Docs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Eligibility Criteria */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Bidder Eligibility Criteria
                </h4>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <span>{tender.eligibility}</span>
                  </div>
                </div>
              </div>

              {/* Official Tender Documents */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Tender Documents & BOQ
                </h4>
                <div className="space-y-1.5">
                  {tender.documents?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-blue-400 transition group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {doc.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({doc.size})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert(`Downloading verified document: ${doc.name}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : activeTab === 'compliance' ? (
            /* ═══ COMPLIANCE DOCUMENTS TAB ═══ */
            <div className="space-y-4">
              {/* Pipeline Info Banner */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-900/60 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
                  <Database className="w-4 h-4" />
                  <span>GeM Compliance Verification Intake</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Uploaded compliance documents are securely stored and automatically processed for compliance verification and audit checks.
                </p>
              </div>

              {/* Upload Form Box */}
              {!isClosed ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Document Category / Type
                      </label>
                      <select
                        value={selectedDocType}
                        onChange={(e) => setSelectedDocType(e.target.value)}
                        disabled={uploading}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {COMPLIANCE_DOC_TYPES.map((cat) => (
                          <option key={cat.id} value={cat.value}>
                            {cat.label} {cat.required ? '*(Mandatory)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Select File (PDF, PNG, JPG - Max 50MB)
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Selected file indicator */}
                  {selectedFile && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-semibold truncate">{selectedFile.name}</span>
                        <span className="text-[10px] opacity-75">
                          ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        disabled={uploading}
                        className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Upload Progress & Stage Status */}
                  {uploading && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          {stageMessage}
                        </span>
                        <span className="font-mono">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Notification (Case 1 & Case 2) */}
                  {uploadError && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* Non-Blocking Notice (Case 3 - Document saved, AI failed) */}
                  {nonBlockingNotice && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>{nonBlockingNotice.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRetryAi(nonBlockingNotice.docRecord)}
                        disabled={uploading}
                        className="px-2.5 py-1 rounded bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 shrink-0 cursor-pointer"
                      >
                        Retry AI
                      </button>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleUploadComplianceDoc}
                      disabled={!selectedFile || uploading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#073567] hover:bg-[#05284f] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing Document...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload &amp; Process Document</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                  <Lock className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  <span>Compliance document submission is closed for this tender.</span>
                </div>
              )}

              {/* Uploaded Documents List */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Uploaded Compliance Documents ({complianceDocs.length})
                </h4>

                {complianceDocs.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No compliance documents uploaded for {tender.referenceNo} yet. Select a document type above and upload.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {complianceDocs.map((doc) => {
                      const isComplete = doc.aiStatus === 'COMPLETED';
                      const isFailed = doc.aiStatus === 'FAILED';
                      const isPending = doc.aiStatus === 'PROCESSING';

                      return (
                        <div
                          key={doc.id}
                          className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {doc.fileName}
                              </p>
                              <div className="flex items-center gap-2 text-[10.5px] text-slate-500 dark:text-slate-400">
                                <span className="uppercase font-mono font-semibold">{doc.documentType}</span>
                                <span>&bull;</span>
                                <span>Doc ID: #{doc.id}</span>
                                <span>&bull;</span>
                                <span>{doc.uploadedAt}</span>
                              </div>
                            </div>
                          </div>

                          {/* AI Pipeline Status Badge */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isComplete && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <Check className="w-3 h-3" />
                                <span>Verified &amp; Indexed</span>
                              </span>
                            )}
                            {isFailed && (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Saved &bull; AI Pending</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRetryAi(doc)}
                                  disabled={uploading}
                                  className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10.5px] font-bold hover:bg-blue-700 cursor-pointer"
                                >
                                  Retry AI
                                </button>
                              </div>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Chunking...</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ═══ QCBS TOP 10 BIDDERS TAB ═══ */
            <QcbsBiddersRanking tender={tender} tenderId={tender.id || tender.referenceNo} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer"
            >
              Close
            </button>
            {activeTab !== 'qcbs' && (
              <button
                type="button"
                onClick={() => setActiveTab('qcbs')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-lg transition cursor-pointer"
                title="View QCBS Rule 192 Top 10 Bidders ranking"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>View QCBS Rankings</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isClosed ? (
              isOfficer ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/dashboard?tab=compliance');
                  }}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition hover:scale-[1.02] cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Officer Evaluation Portal</span>
                </button>
              ) : activeTab === 'overview' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAiChatOpen(true)}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition hover:scale-[1.02] cursor-pointer"
                  >
                    <Bot className="w-4 h-4 text-emerald-300" />
                    <span>Ask AI Assistant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('compliance')}
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#073567] hover:bg-[#05284f] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition hover:scale-[1.02] cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Compliance Docs &amp; Apply</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/verification?tenderId=${tender.id}`);
                  }}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition hover:scale-[1.02] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Finalize &amp; Submit Bid Proposal</span>
                </button>
              )
            ) : (
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 select-none">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Tender Closed &bull; Submissions Unavailable</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Standalone Full-Screen AI Tender Assistant (RAG Pipeline) */}
    {isAiChatOpen && (
      <TenderChatbot
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        tenderId={tender.id || tender.referenceNo}
        tenderTitle={tender.title}
        tenderRef={tender.referenceNo}
        tenderDepartment={tender.department || tender.ministry}
        tenderValue={tender.value}
        tenderDeadline={tender.closes || tender.daysLeft}
      />
    )}
  </>,
  document.body
);
};

export default TenderDetailModal;
