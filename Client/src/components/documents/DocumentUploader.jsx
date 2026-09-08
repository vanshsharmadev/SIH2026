import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  Trash2,
  Plus,
  FileArchive,
} from 'lucide-react';

const DocumentUploader = ({ onUpload, acceptedFormats = '.pdf,.docx,.zip' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'zip' || ext === 'rar' || ext === '7z') {
      return <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (ext === 'docx' || ext === 'doc') {
      return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />;
  };

  const addFiles = (newFilesList) => {
    if (!newFilesList || newFilesList.length === 0) return;
    const newArray = Array.from(newFilesList);

    setFiles((prev) => {
      // Avoid duplicates with same name and size
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const filteredNew = newArray.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
      const updated = [...prev, ...filteredNew];
      if (onUpload) onUpload(updated);
      return updated;
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (indexToRemove) => {
    setFiles((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (onUpload) onUpload(updated);
      return updated;
    });
  };

  const handleClearAll = () => {
    setFiles([]);
    if (onUpload) onUpload([]);
  };

  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div className="space-y-3">
      {/* Hidden file input supporting multiple files */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept={acceptedFormats}
        onChange={handleChange}
        id="multi-doc-input"
      />

      {/* Dropzone Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-5 sm:p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 scale-[1.005]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
      >
        <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 shadow-2xs">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
          Drag & drop multiple bid documents here, or{' '}
          <label
            htmlFor="multi-doc-input"
            className="text-blue-600 dark:text-blue-400 cursor-pointer underline hover:text-blue-700 font-bold"
          >
            browse files
          </label>
        </p>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Select multiple files simultaneously &bull; Supported: PDF, DOCX, ZIP (Up to 50MB each)
        </p>
      </div>

      {/* Uploaded Files Multi-List */}
      {files.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-150">
          {/* Header Row with Count, Total Size & Clear All */}
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {files.length} {files.length === 1 ? 'Document' : 'Documents'} Attached
              </span>
              <span className="text-[11px] text-slate-400">
                ({formatFileSize(totalSize)})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label
                htmlFor="multi-doc-input"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add More</span>
              </label>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Files List Items */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs hover:border-blue-300 dark:hover:border-blue-600 transition group"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {getFileIcon(file.name)}
                  <span
                    className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px] sm:max-w-[280px]"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition cursor-pointer"
                    title={`Remove ${file.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
