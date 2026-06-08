import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle2, FileText, Trash2 } from 'lucide-react';

interface UploadDropzoneProps {
  onFilesSelect: (files: File[]) => void;
}

export default function UploadDropzone({ onFilesSelect }: UploadDropzoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFiles(acceptedFiles);
      onFilesSelect(acceptedFiles);
    }
  }, [onFilesSelect]);

  const removeFile = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updated);
    onFilesSelect(updated);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: true
  } as any);

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? 'border-teal-400 bg-teal-950/10'
          : selectedFiles.length > 0
          ? 'border-emerald-500/50 bg-[#16222F]/40'
          : 'border-teal-800 hover:border-teal-500/60 bg-[#111827]'
      }`}
      id="invoice-upload-dropzone"
    >
      <input {...getInputProps()} />

      {selectedFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <UploadCloud className="text-teal-400 h-12 w-12 animate-pulse" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white font-display uppercase tracking-wider">
              {isDragActive ? 'Drop your PDFs here' : 'Drop your invoice PDFs here'}
            </p>
            <p className="text-xs text-[#94A3B8]">
              or click to browse local files (Supports Multiple PDFs)
            </p>
          </div>
          <p className="text-[10px] text-[#475569] font-mono tracking-widest uppercase">
            PDF only · Max 20MB · Multiple allowed
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4 py-6" id="selected-file-preview">
          <div className="relative">
            <FileText className="text-teal-300 h-14 w-14" />
            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-2 max-w-[340px] text-center w-full">
            <p className="text-sm font-bold text-teal-400 font-mono">
              {selectedFiles.length} File(s) Selected
            </p>
            <div className="max-h-[120px] overflow-y-auto divide-y divide-teal-950/20 text-left bg-black/30 rounded-lg p-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 text-[11px] font-mono text-white gap-2">
                  <span className="truncate flex-1">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => removeFile(idx, e)}
                    className="text-red-400 hover:text-red-200 hover:scale-105 shrink-0 px-1 py-0.5"
                    title="Remove item"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
