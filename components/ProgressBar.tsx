import React from 'react';
import { AppStatus, ProcessingState } from '../types';

interface ProgressBarProps {
  state: ProcessingState;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ state }) => {
  if (state.status === AppStatus.IDLE || state.status === AppStatus.COMPLETE) return null;

  const getStatusMessage = () => {
    switch (state.status) {
      case AppStatus.ANALYZING: return "Leyendo el documento...";
      case AppStatus.PLANNING: return "Planificando el storyboard...";
      case AppStatus.GENERATING_IMAGES: return `Dibujando la página ${state.currentStep} de ${state.totalSteps}...`;
      case AppStatus.ERROR: return "Ups, algo salió mal.";
      default: return "Procesando...";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 bg-white p-6 rounded-2xl shadow-lg border border-teal-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-lg font-bold text-slate-700 animate-pulse">{getStatusMessage()}</span>
        <span className="text-sm font-bold text-teal-600">{Math.round(state.progress)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-teal-400 to-cyan-500 h-4 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${state.progress}%` }}
        ></div>
      </div>
      
      <div className="mt-4 flex justify-center space-x-4">
          <div className={`p-3 rounded-xl ${state.status === AppStatus.ANALYZING ? 'bg-teal-100 ring-2 ring-teal-500' : 'bg-slate-50 opacity-50'}`}>
             <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
          </div>
          <div className="h-0.5 w-8 bg-teal-200 self-center"></div>
          <div className={`p-3 rounded-xl ${state.status === AppStatus.PLANNING ? 'bg-teal-100 ring-2 ring-teal-500' : 'bg-slate-50 opacity-50'}`}>
             <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
             </svg>
          </div>
          <div className="h-0.5 w-8 bg-teal-200 self-center"></div>
          <div className={`p-3 rounded-xl ${state.status === AppStatus.GENERATING_IMAGES ? 'bg-teal-100 ring-2 ring-teal-500' : 'bg-slate-50 opacity-50'}`}>
             <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
          </div>
      </div>
    </div>
  );
};
