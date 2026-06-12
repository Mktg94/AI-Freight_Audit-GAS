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
    maxSize: 20 * 1024 * 1024,
    multiple: true
  } as any);

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
        isDragActive
          ? 'border-indigo-300 bg-indigo-50/30'
          : selectedFiles.length > 0
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
      }`}
      id="invoice-upload-dropzone"
    >
      <input {...getInputProps()} />

      {selectedFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <UploadCloud className="text-gray-400 h-10 w-10" />
          <div className="space-y-1">
            <p className="text-base font-medium text-gray-700">
              {isDragActive ? 'Drop your PDFs here' : 'Drop your invoice PDFs here'}
            </p>
            <p className="text-sm text-gray-400">
              or click to browse
            </p>
          </div>
          <p className="text-xs text-gray-300 font-mono">
            PDF only · Max 20MB · Multiple allowed
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4 py-4" id="selected-file-preview">
          <div className="relative">
            <FileText className="text-green-500 h-12 w-12" />
            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-md">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-2 max-w-[340px] text-center w-full">
            <p className="text-sm font-semibold text-gray-900">
              {selectedFiles.length} File(s) Selected
            </p>
            <div className="max-h-[120px] overflow-y-auto divide-y divide-gray-100 text-left bg-gray-50 rounded-xl p-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 text-xs font-mono text-gray-700 gap-2">
                  <span className="truncate flex-1">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => removeFile(idx, e)}
                    className="text-gray-400 hover:text-red-500 shrink-0 px-1 py-0.5"
                    title="Remove item"
                  >
                    <Trash2 size={12} />
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
