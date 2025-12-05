import React from 'react';
import { TemplateConfig, OutputMode, OutputLanguage, AVAILABLE_LANGUAGES } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTemplate: TemplateConfig;
  onOpenTemplateManager: () => void;
  outputMode: OutputMode;
  onOutputModeChange: (mode: OutputMode) => void;
  outputLanguage: OutputLanguage;
  onOutputLanguageChange: (lang: OutputLanguage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeTemplate,
  onOpenTemplateManager,
  outputMode,
  onOutputModeChange,
  outputLanguage,
  onOutputLanguageChange,
}) => {
  return (
    <>
      <button
        onClick={onToggle}
        className={`fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all ${
          isOpen ? 'left-[280px]' : 'left-4'
        }`}
        style={{ transition: 'left 0.3s ease-in-out' }}
      >
        <svg 
          className={`w-6 h-6 text-teal-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div 
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl border-r border-slate-200 z-40 transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'w-72' : 'w-0'
        }`}
      >
        <div className="w-72 h-full flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img 
                src={`${import.meta.env.BASE_URL}nexthealth-logo.png`} 
                alt="NextHealth" 
                className="h-8 w-auto"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Panel de configuracion</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-semibold text-sm">Plantilla</span>
              </div>
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-3 border border-teal-100">
                <p className="font-medium text-teal-700 text-sm truncate text-center">{activeTemplate.name}</p>
              </div>
              <button
                onClick={onOpenTemplateManager}
                className="w-full px-4 py-2.5 bg-white border border-teal-200 text-teal-700 rounded-xl font-medium text-sm shadow-sm hover:shadow-md hover:border-teal-400 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Personalizar
              </button>
            </div>

            <div className="h-px bg-slate-200"></div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-sm">Modo de salida</span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => onOutputModeChange('tebeo')}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    outputMode === 'tebeo'
                      ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      outputMode === 'tebeo' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-slate-100'
                    }`}>
                      <svg className={`w-4 h-4 ${outputMode === 'tebeo' ? 'text-white' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6z"/>
                      </svg>
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${outputMode === 'tebeo' ? 'text-amber-700' : 'text-slate-600'}`}>Tebeo</p>
                      <p className={`text-xs ${outputMode === 'tebeo' ? 'text-amber-600' : 'text-slate-400'}`}>Viñetas amigables</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => onOutputModeChange('brochure')}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    outputMode === 'brochure'
                      ? 'border-teal-400 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      outputMode === 'brochure' ? 'bg-gradient-to-br from-teal-400 to-cyan-500' : 'bg-slate-100'
                    }`}>
                      <svg className={`w-4 h-4 ${outputMode === 'brochure' ? 'text-white' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${outputMode === 'brochure' ? 'text-teal-700' : 'text-slate-600'}`}>Brochure</p>
                      <p className={`text-xs ${outputMode === 'brochure' ? 'text-teal-600' : 'text-slate-400'}`}>Fotografia profesional</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-200"></div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="font-semibold text-sm">Idioma del Resultado</span>
              </div>
              
              <div className="grid grid-cols-1 gap-1.5">
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => onOutputLanguageChange(lang.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-all text-left flex items-center gap-2 ${
                      outputLanguage === lang.value
                        ? 'border-teal-400 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-teal-200'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className={`text-sm font-medium ${
                      outputLanguage === lang.value ? 'text-teal-700' : 'text-slate-600'
                    }`}>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Powered by NextHealth AI</span>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};
