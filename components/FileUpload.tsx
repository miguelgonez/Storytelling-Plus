import React, { useRef, useState, useEffect } from 'react';

interface FileUploadProps {
  onFileSelect: (fileBase64: string, mimeType: string) => void;
  isLoading: boolean;
}

interface ConsentRecord {
  timestamp: string;
  accepted: boolean;
  userAgent: string;
  sessionId: string;
}

const generateSessionId = (): string => {
  return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sessionId] = useState(() => generateSessionId());
  const [consentLog, setConsentLog] = useState<ConsentRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const disclaimerRef = useRef<HTMLDivElement | null>(null);

  const MAX_FILE_MB = 15;
  const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

  const CONSENT_STORAGE_KEY = 'storytelia_consent_session';

  useEffect(() => {
    const savedConsent = sessionStorage.getItem(CONSENT_STORAGE_KEY);
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent) as ConsentRecord;
        if (parsed.accepted && parsed.sessionId === sessionId) {
          setDisclaimerAccepted(true);
          setConsentLog(parsed);
        }
      } catch (e) {
        sessionStorage.removeItem(CONSENT_STORAGE_KEY);
      }
    }
  }, [sessionId]);

  const recordConsent = () => {
    const record: ConsentRecord = {
      timestamp: new Date().toISOString(),
      accepted: true,
      userAgent: navigator.userAgent,
      sessionId: sessionId,
    };
    
    setConsentLog(record);
    sessionStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    
    console.log('[COMPLIANCE] Consent recorded:', record);
    
    return record;
  };

  const handleAcceptDisclaimer = () => {
    if (!disclaimerAccepted) return;
    
    recordConsent();
    setShowDisclaimer(false);
    
    if (pendingFile) {
      processFileAfterConsent(pendingFile);
      setPendingFile(null);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      initiateFileProcess(file);
    }
  };

  const initiateFileProcess = (file: File) => {
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

    if (consentLog?.accepted) {
      processFileAfterConsent(file);
    } else {
      setPendingFile(file);
      setShowDisclaimer(true);
      setDisclaimerAccepted(false);
    }
  };

  const processFileAfterConsent = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
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
      initiateFileProcess(file);
    }
  };

  const openFilePicker = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const closeDisclaimer = () => {
    setShowDisclaimer(false);
    setPendingFile(null);
    setDisclaimerAccepted(false);
  };

  return (
    <>
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

          {consentLog?.accepted && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Condiciones aceptadas en esta sesión</span>
            </div>
          )}
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

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-amber-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Advertencia Legal</h2>
                  <p className="text-amber-100 text-sm">Aceptación de Responsabilidad</p>
                </div>
              </div>
            </div>

            <div 
              ref={disclaimerRef}
              className="p-6 overflow-y-auto max-h-[50vh] text-sm text-slate-700 space-y-4"
            >
              <p className="font-semibold text-slate-800">
                Al subir este PDF, usted declara y acepta lo siguiente:
              </p>

              <div className="space-y-3">
                <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border-l-4 border-teal-500">
                  <span className="font-bold text-teal-600 shrink-0">1.</span>
                  <p>
                    El contenido del PDF ha sido previamente <strong>redactado, validado y aprobado por profesionales cualificados</strong> (ej. médicos, comités éticos o departamentos legales) conforme a la normativa aplicable (Ley 33/2011 de Salud Pública, RD 1416/1994 sobre publicidad de medicamentos, y Reglamento (UE) 2017/745 si procede).
                  </p>
                </div>

                <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border-l-4 border-cyan-500">
                  <span className="font-bold text-cyan-600 shrink-0">2.</span>
                  <p>
                    <strong>Storytelia Salud es una herramienta de maquetación y diseño visual automatizado.</strong> No genera, modifica, interpreta ni valida información médica o sanitaria. El texto se extrae y reutiliza de forma literal (verbatim) del PDF, y las imágenes se generan únicamente como ilustraciones estéticas genéricas, sin finalidad diagnóstica, terapéutica o preventiva.
                  </p>
                </div>

                <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border-l-4 border-amber-500">
                  <span className="font-bold text-amber-600 shrink-0">3.</span>
                  <p>
                    <strong>Usted asume la responsabilidad exclusiva</strong> por la veracidad, exactitud, actualidad y adecuación del contenido sanitario del PDF, así como por la revisión final del material generado antes de su uso o difusión. Storytelia Salud no proporciona asesoramiento médico ni garantiza la idoneidad clínica de los outputs.
                  </p>
                </div>

                <div className="flex gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <span className="font-bold text-red-600 shrink-0">4.</span>
                  <p>
                    <strong>Prohibido usar esta herramienta para fines clínicos</strong>, como diagnóstico, tratamiento, monitorización o toma de decisiones médicas personalizadas. <strong>No suba PDFs con datos identificables de pacientes</strong> (cumplimiento RGPD).
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-amber-800 text-xs leading-relaxed">
                  Al marcar esta casilla y proceder con la carga del PDF, usted confirma que ha leído, entendido y acepta estas condiciones, eximiendo a Storytelia Salud de cualquier responsabilidad derivada del contenido o uso del material generado.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-6 h-6 border-2 border-slate-300 rounded-md bg-white peer-checked:bg-teal-500 peer-checked:border-teal-500 transition-all flex items-center justify-center group-hover:border-teal-400">
                    {disclaimerAccepted && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  Acepto las condiciones <span className="text-red-500">(obligatorio para continuar)</span>
                </span>
              </label>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeDisclaimer}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAcceptDisclaimer}
                  disabled={!disclaimerAccepted}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    disclaimerAccepted
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg hover:from-teal-400 hover:to-cyan-500'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Aceptar y Continuar
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-400 text-center">
                Session ID: {sessionId.substring(0, 12)}... | {new Date().toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
