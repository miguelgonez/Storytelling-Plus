import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { FileUpload } from './components/FileUpload';
import { ProgressBar } from './components/ProgressBar';
import { StorytellingViewer } from './components/StorytellingViewer';
import { TemplateManager } from './components/TemplateManager';
import { Sidebar } from './components/Sidebar';
import { AppStatus, ProcessingState, StoryPage, TemplateConfig, OutputMode, OutputLanguage } from './types';
import { analyzePaper, planStory, generateTebeoPage, generateBrochurePage } from './services/geminiService';
import { DEFAULT_TEMPLATE, buildPromptsFromTemplate } from './constants';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: AppStatus.IDLE,
    progress: 0,
    totalSteps: 0,
    currentStep: 0,
  });

  const [storyPages, setStoryPages] = useState<StoryPage[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<string>('');
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<TemplateConfig>(DEFAULT_TEMPLATE);
  const [outputMode, setOutputMode] = useState<OutputMode>('tebeo');
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('español');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if ((window as any).aistudio?.hasSelectedApiKey) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key status", e);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('storytelling.templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TemplateConfig[];
        setTemplates(parsed);
        if (parsed[0]) setActiveTemplate(parsed[0]);
      } catch (e) {
        console.error('No se pudieron cargar las plantillas guardadas', e);
      }
    }
  }, []);

  const persistTemplates = (list: TemplateConfig[]) => {
    setTemplates(list);
    localStorage.setItem('storytelling.templates', JSON.stringify(list));
  };

  const handleSaveTemplate = (template: TemplateConfig) => {
    const trimmedName = template.name.trim();
    if (!trimmedName) return;
    const updated = [
      template,
      ...templates.filter(t => t.name !== trimmedName),
    ];
    persistTemplates(updated);
    setActiveTemplate(template);
  };

  const handleSelectTemplate = (template: TemplateConfig) => {
    setActiveTemplate(template);
  };

  const handleDeleteTemplate = (name: string) => {
    const filtered = templates.filter(t => t.name !== name);
    persistTemplates(filtered);
    if (activeTemplate.name === name) {
      setActiveTemplate(filtered[0] ?? DEFAULT_TEMPLATE);
    }
  };

  const handleApiKeySelect = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const sanitizeFileName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const exportToPDF = async () => {
    if (storyPages.length === 0) return;
    
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imageWidth = pageWidth - (margin * 2);
      const imageHeight = imageWidth * (4/3);
      const descriptionY = margin + imageHeight + 8;

      for (let i = 0; i < storyPages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const page = storyPages[i];
        
        pdf.setFillColor(245, 247, 250);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        pdf.setFontSize(14);
        pdf.setTextColor(59, 130, 246);
        pdf.text(`Página ${page.pageNumber}`, margin, margin + 5);

        try {
          pdf.addImage(page.imageUrl, 'PNG', margin, margin + 10, imageWidth, imageHeight);
        } catch (imgError) {
          console.error('Error adding image:', imgError);
        }

        pdf.setFontSize(11);
        pdf.setTextColor(51, 65, 85);
        const splitDescription = pdf.splitTextToSize(page.description, imageWidth);
        pdf.text(splitDescription, margin, descriptionY + 10);

        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`${i + 1} / ${storyPages.length}`, pageWidth - margin - 10, pageHeight - margin);
        pdf.text('Powered by Nexthealth', margin, pageHeight - margin);
      }

      const fileName = `${sanitizeFileName(activeTemplate.name)}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar el PDF. Por favor intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (fileBase64: string, mimeType: string) => {
    const prompts = buildPromptsFromTemplate(activeTemplate, outputLanguage);
    setStoryPages([]);
    setAnalysisSummary('');
    setProcessingState({
      status: AppStatus.ANALYZING,
      progress: 5,
      totalSteps: 3, 
      currentStep: 1,
    });

    try {
      console.log("Starting analysis...");
      const summary = await analyzePaper(fileBase64, mimeType, prompts);
      setAnalysisSummary(summary);
      setProcessingState(prev => ({
        ...prev,
        status: AppStatus.PLANNING,
        progress: 20,
        currentStep: 2
      }));

      console.log("Planning story...", summary);
      const plan = await planStory(summary, prompts);
      console.log("Plan generated:", plan);
      
      const totalPages = plan.length;
      const modeLabel = outputMode === 'tebeo' ? 'Tebeo' : 'Brochure';
      setProcessingState(prev => ({
        ...prev,
        status: AppStatus.GENERATING_IMAGES,
        progress: 30,
        totalSteps: totalPages,
        currentStep: 0,
        currentStepDescription: `Generando ${modeLabel}...`
      }));

      const pages: StoryPage[] = [];
      
      for (let i = 0; i < totalPages; i++) {
        const pagePlan = plan[i];
        
        setProcessingState(prev => ({
          ...prev,
          currentStep: i + 1,
          progress: 30 + ((i / totalPages) * 70),
          currentStepDescription: `Generando ${modeLabel} ${i + 1} de ${totalPages}...`
        }));

        console.log(`Generating ${modeLabel} page ${pagePlan.pageNumber}...`);
        
        const generatedPage = outputMode === 'tebeo'
          ? await generateTebeoPage(summary, pagePlan, prompts)
          : await generateBrochurePage(summary, pagePlan, prompts);
        
        pages.push(generatedPage);
        setStoryPages([...pages]);
      }

      setProcessingState(prev => ({
        ...prev,
        status: AppStatus.COMPLETE,
        progress: 100
      }));

    } catch (error: any) {
      console.error("Workflow failed", error);
      
      const errorMessage = error.message || JSON.stringify(error);
      
      if (
        errorMessage.includes("UNAUTHENTICATED") || 
        errorMessage.includes("401") || 
        errorMessage.includes("Requested entity was not found") ||
        errorMessage.includes("invalid authentication credentials")
      ) {
        setHasApiKey(false);
        setProcessingState(prev => ({
          ...prev,
          status: AppStatus.IDLE
        }));
        alert("Authentication session expired or invalid. Please select your API Key again.");
        return;
      }

      setProcessingState(prev => ({
        ...prev,
        status: AppStatus.ERROR,
        error: errorMessage
      }));
    }
  };

  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
          <div className="text-blue-600 font-bold text-xl animate-pulse">Inicializando...</div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-4 border-blue-100">
          <div className="text-5xl mb-6">🔐</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4 font-storytelling">
            Autenticación requerida
          </h1>
          <p className="text-slate-600 mb-8">
            Para generar narrativas visuales de alta calidad con <strong>Gemini 3 Pro</strong>, conecta tu clave de API de Google Cloud.
          </p>
          
          <button 
            onClick={handleApiKeySelect}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-500 transition-all transform hover:scale-105 mb-4"
          >
            Conectar clave de API
          </button>
          
          <div className="text-xs text-slate-400 mt-4">
            <p>Requiere una clave de proyecto GCP con facturación.</p>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Más información sobre la facturación
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTemplate={activeTemplate}
        onOpenTemplateManager={() => setIsTemplatePanelOpen(true)}
        outputMode={outputMode}
        onOutputModeChange={setOutputMode}
        outputLanguage={outputLanguage}
        onOutputLanguageChange={setOutputLanguage}
      />

      <div 
        className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-72' : 'ml-0'}`}
      >
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <header className="mb-8 text-center pt-8">
              <div className="inline-flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-lg border border-slate-100 mb-6">
                <img 
                  src={`${import.meta.env.BASE_URL}nexthealth-logo.png`} 
                  alt="NextHealth" 
                  className="h-10 w-auto"
                />
                <div className="h-8 w-px bg-slate-200"></div>
                <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Storytelling en Salud
                </span>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 mb-4">
                <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                  outputMode === 'tebeo' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                    : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                }`}>
                  Modo: {outputMode === 'tebeo' ? 'Tebeo' : 'Brochure'}
                </div>
                <div className="px-4 py-2 rounded-full text-sm font-medium bg-white text-teal-700 border border-teal-200 shadow-sm">
                  {activeTemplate.name}
                </div>
              </div>

              <p className="text-slate-600 max-w-lg mx-auto">
                Transforma documentos de salud en historias visuales atractivas con IA
              </p>
            </header>

            <main>
              {processingState.status === AppStatus.IDLE && (
                <div className="animate-fade-in-up">
                  <FileUpload 
                    onFileSelect={handleFileSelect} 
                    isLoading={false} 
                  />
                  
                  <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-teal-500 hover:shadow-xl transition-shadow">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center text-white text-lg font-bold mb-3">1</div>
                      <h3 className="font-bold text-base mb-1 text-slate-800">Sube tu PDF</h3>
                      <p className="text-sm text-slate-600">Articulos, ensayos y documentos de salud.</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-cyan-500 hover:shadow-xl transition-shadow">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-lg font-bold mb-3">2</div>
                      <h3 className="font-bold text-base mb-1 text-slate-800">Analisis con IA</h3>
                      <p className="text-sm text-slate-600">Extraemos conceptos clave automaticamente.</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-teal-600 hover:shadow-xl transition-shadow">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center text-white text-lg font-bold mb-3">3</div>
                      <h3 className="font-bold text-base mb-1 text-slate-800">Historia visual</h3>
                      <p className="text-sm text-slate-600">Generamos imagenes para tu narrativa.</p>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Usa el panel lateral para configurar plantillas, modo de salida e instrucciones
                    </p>
                  </div>
                </div>
              )}

              {processingState.status !== AppStatus.IDLE && processingState.status !== AppStatus.COMPLETE && (
                <ProgressBar state={processingState} />
              )}

              {processingState.status === AppStatus.ERROR && (
                <div className="mt-8 p-6 bg-red-100 text-red-700 rounded-xl max-w-2xl mx-auto border border-red-200">
                  <h3 className="font-bold text-xl mb-2">Error</h3>
                  <p>{processingState.error || "Ocurrio un error inesperado."}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {storyPages.length > 0 && (
                <div className="animate-fade-in">
                  <StorytellingViewer pages={storyPages} />
                  {processingState.status === AppStatus.COMPLETE && (
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <button 
                        onClick={exportToPDF}
                        disabled={isExporting}
                        className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full font-bold shadow-lg hover:from-teal-400 hover:to-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isExporting ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Exportando...
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Descargar PDF
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-slate-700 text-white rounded-full font-bold shadow-lg hover:bg-slate-600 transition"
                      >
                        Procesar otro documento
                      </button>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {isTemplatePanelOpen && (
        <TemplateManager
          isOpen={isTemplatePanelOpen}
          onClose={() => setIsTemplatePanelOpen(false)}
          templates={templates}
          activeTemplate={activeTemplate}
          onSave={handleSaveTemplate}
          onSelect={handleSelectTemplate}
          onDelete={handleDeleteTemplate}
        />
      )}
    </div>
  );
};

export default App;
