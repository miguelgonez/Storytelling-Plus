import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (fileBase64: string, mimeType: string) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_MB = 15;
  const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Solo se aceptan archivos PDF.');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError(`El PDF debe pesar ${MAX_FILE_MB} MB o menos.`);
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 data (remove "data:application/pdf;base64," prefix)
      const base64Data = result.split(',')[1];
      onFileSelect(base64Data, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const openFilePicker = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300 shadow-lg
          ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-teal-300 bg-white'}
          ${isLoading ? 'opacity-50 pointer-events-none' : 'hover:border-teal-400 hover:shadow-xl'}
        `}
      >
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-md">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Sube tu documento de salud</h3>
        <p className="text-slate-500 mb-6">Arrastra y suelta tu PDF aqui, o haz clic para buscarlo</p>
        
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          disabled={isLoading}
        />
        
        <button 
          type="button"
          onClick={openFilePicker}
          className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full font-bold shadow-lg transform transition hover:scale-105 hover:from-teal-400 hover:to-cyan-500"
        >
          Seleccionar PDF
        </button>
      </div>

      <p className="mt-4 text-sm text-slate-500 text-center">
        Solo PDF. Tamano maximo: {MAX_FILE_MB} MB.
      </p>

      {error && (
        <div className="mt-3 text-sm font-semibold text-red-600 text-center">
          {error}
        </div>
      )}
    </div>
  );
};
