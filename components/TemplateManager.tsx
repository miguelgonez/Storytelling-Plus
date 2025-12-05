import React, { useEffect, useState } from 'react';
import { TemplateConfig } from '../types';
import { DEFAULT_TEMPLATE } from '../constants';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  templates: TemplateConfig[];
  activeTemplate: TemplateConfig;
  onSave: (template: TemplateConfig) => void;
  onSelect: (template: TemplateConfig) => void;
  onDelete: (name: string) => void;
}

const emptyTemplate: TemplateConfig = {
  name: '',
  protagonistas: '',
  tono: '',
  rangoPaginas: { min: 8, max: 8 },
  densidadPalabras: { min: 70, max: 120 },
  idioma: 'español',
  tebeo: {
    estilo: '',
    instrucciones: '',
  },
  brochure: {
    estilo: '',
    instrucciones: '',
  },
};

type ModeTab = 'general' | 'tebeo' | 'brochure';

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  templates,
  activeTemplate,
  onSave,
  onSelect,
  onDelete,
}) => {
  const [form, setForm] = useState<TemplateConfig>(activeTemplate ?? emptyTemplate);
  const [activeTab, setActiveTab] = useState<ModeTab>('general');

  useEffect(() => {
    setForm(activeTemplate ?? emptyTemplate);
  }, [activeTemplate, isOpen]);

  if (!isOpen) return null;

  const updateField = <K extends keyof TemplateConfig>(key: K, value: TemplateConfig[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateRange = (key: 'min' | 'max', value: number) => {
    setForm(prev => ({
      ...prev,
      rangoPaginas: { ...prev.rangoPaginas, [key]: value },
    }));
  };

  const updateDensidad = (key: 'min' | 'max', value: number) => {
    setForm(prev => ({
      ...prev,
      densidadPalabras: { ...(prev.densidadPalabras || { min: 70, max: 120 }), [key]: value },
    }));
  };

  const updateTebeo = (key: 'estilo' | 'instrucciones', value: string) => {
    setForm(prev => ({
      ...prev,
      tebeo: { ...prev.tebeo, [key]: value },
    }));
  };

  const updateBrochure = (key: 'estilo' | 'instrucciones', value: string) => {
    setForm(prev => ({
      ...prev,
      brochure: { ...prev.brochure, [key]: value },
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const min = Math.min(form.rangoPaginas.min, form.rangoPaginas.max);
    const max = Math.max(form.rangoPaginas.min, form.rangoPaginas.max);
    const densidad = form.densidadPalabras || { min: 70, max: 120 };
    const densidadMin = Math.min(densidad.min, densidad.max);
    const densidadMax = Math.max(densidad.min, densidad.max);
    onSave({
      ...form,
      name: form.name.trim(),
      rangoPaginas: { min, max },
      densidadPalabras: { min: densidadMin, max: densidadMax },
    });
  };

  const tabs: { id: ModeTab; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'general',
      label: 'General',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'teal',
    },
    {
      id: 'tebeo',
      label: 'Tebeo',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6z"/>
        </svg>
      ),
      color: 'amber',
    },
    {
      id: 'brochure',
      label: 'Brochure',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      ),
      color: 'cyan',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-teal-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50">
          <div>
            <p className="text-xs uppercase font-bold text-teal-600 tracking-wide">Plantillas</p>
            <h2 className="text-2xl font-bold text-slate-900">Personaliza los prompts</h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-white text-slate-700 font-semibold hover:bg-slate-100 border border-slate-200 shadow-sm"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === tab.id
                      ? tab.id === 'tebeo'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                        : tab.id === 'brochure'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                        : 'bg-white text-teal-700 shadow-md'
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {activeTab === 'general' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      Nombre de la plantilla
                      <input
                        className="mt-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        value={form.name}
                        onChange={e => updateField('name', e.target.value)}
                        placeholder="Ej. Pediatría colorida"
                        required
                      />
                    </label>
                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      Idioma
                      <input
                        className="mt-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        value={form.idioma}
                        onChange={e => updateField('idioma', e.target.value)}
                        placeholder="español"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col text-sm font-semibold text-slate-700">
                    Protagonistas
                    <input
                      className="mt-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      value={form.protagonistas}
                      onChange={e => updateField('protagonistas', e.target.value)}
                      placeholder="Ana (doctora) y Alex (paciente curioso)"
                    />
                    <span className="text-xs text-slate-400 mt-1">Personajes que aparecerán en las imágenes generadas</span>
                  </label>

                  <label className="flex flex-col text-sm font-semibold text-slate-700">
                    Tono
                    <input
                      className="mt-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      value={form.tono}
                      onChange={e => updateField('tono', e.target.value)}
                      placeholder="empático, didáctico, visual"
                    />
                    <span className="text-xs text-slate-400 mt-1">Define cómo se comunica el contenido</span>
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      Páginas mínimas
                      <input
                        type="number"
                        min={1}
                        className="mt-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        value={form.rangoPaginas.min}
                        onChange={e => updateRange('min', Number(e.target.value))}
                      />
                    </label>
                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      Páginas máximas
                      <input
                        type="number"
                        min={1}
                        className="mt-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        value={form.rangoPaginas.max}
                        onChange={e => updateRange('max', Number(e.target.value))}
                      />
                    </label>
                  </div>

                  <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-bold text-cyan-700">Densidad de texto por página</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col text-sm font-semibold text-slate-700">
                        Palabras mínimas
                        <input
                          type="number"
                          min={20}
                          max={300}
                          className="mt-1 rounded-xl border border-cyan-200 px-4 py-2.5 focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white"
                          value={form.densidadPalabras?.min || 70}
                          onChange={e => updateDensidad('min', Number(e.target.value))}
                        />
                      </label>
                      <label className="flex flex-col text-sm font-semibold text-slate-700">
                        Palabras máximas
                        <input
                          type="number"
                          min={20}
                          max={300}
                          className="mt-1 rounded-xl border border-cyan-200 px-4 py-2.5 focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white"
                          value={form.densidadPalabras?.max || 120}
                          onChange={e => updateDensidad('max', Number(e.target.value))}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-cyan-600 mt-2">Controla cuánto texto aparece debajo de cada imagen</p>
                  </div>
                </>
              )}

              {activeTab === 'tebeo' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6z"/>
                      </svg>
                      <span className="font-bold text-amber-700">Modo Tebeo - Viñetas amigables</span>
                    </div>
                    <p className="text-sm text-amber-600">
                      Genera ilustraciones estilo cómic europeo con personajes expresivos, colores vibrantes y narrativa visual.
                    </p>
                  </div>

                  <label className="flex flex-col text-sm font-semibold text-slate-700">
                    Estilo visual
                    <textarea
                      className="mt-1 rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                      value={form.tebeo.estilo}
                      onChange={e => updateTebeo('estilo', e.target.value)}
                      placeholder="Viñetas amigables estilo tebeo español, personajes expresivos..."
                      rows={3}
                    />
                    <span className="text-xs text-slate-400 mt-1">Describe el estilo artístico de las ilustraciones</span>
                  </label>

                  <label className="flex flex-col text-sm font-semibold text-slate-700">
                    Instrucciones específicas
                    <textarea
                      className="mt-1 rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                      value={form.tebeo.instrucciones}
                      onChange={e => updateTebeo('instrucciones', e.target.value)}
                      placeholder="Ej: Enfocarse en escenas de consulta médica, usar colores pastel, incluir elementos humorísticos..."
                      rows={4}
                    />
                    <span className="text-xs text-slate-400 mt-1">Guía adicional para la generación de imágenes en modo Tebeo</span>
                  </label>
                </div>
              )}

              {activeTab === 'brochure' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                      <span className="font-bold text-teal-700">Modo Brochure - Fotografía profesional</span>
                    </div>
                    <p className="text-sm text-teal-600">
                      Genera imágenes hiperrealistas estilo folleto corporativo con fotografía profesional de alta calidad.
                    </p>
                  </div>

                  <label className="flex flex-col text-sm font-semibold text-slate-700">
                    Estilo visual
                    <textarea
                      className="mt-1 rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
                      value={form.brochure.estilo}
                      onChange={e => updateBrochure('estilo', e.target.value)}
                      placeholder="Fotografía profesional 8K, iluminación de estudio, estética clínica premium..."
                      rows={3}
                    />
                    <span className="text-xs text-slate-400 mt-1">Describe el estilo fotográfico de las imágenes</span>
                  </label>

                  <label className="flex flex-col text-sm font-semibold text-slate-700">
                    Instrucciones específicas
                    <textarea
                      className="mt-1 rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
                      value={form.brochure.instrucciones}
                      onChange={e => updateBrochure('instrucciones', e.target.value)}
                      placeholder="Ej: Usar fondos de hospital moderno, incluir equipamiento médico, mostrar interacciones médico-paciente..."
                      rows={4}
                    />
                    <span className="text-xs text-slate-400 mt-1">Guía adicional para la generación de imágenes en modo Brochure</span>
                  </label>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full font-semibold hover:from-teal-400 hover:to-cyan-500 shadow-md transition"
                >
                  Guardar plantilla
                </button>
                <button
                  type="button"
                  onClick={() => setForm(DEFAULT_TEMPLATE)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-800 rounded-full font-semibold hover:bg-slate-200 transition"
                >
                  Usar plantilla base
                </button>
                <button
                  type="button"
                  onClick={() => setForm(emptyTemplate)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full font-semibold hover:bg-slate-50 transition"
                >
                  Limpiar campos
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Tus plantillas</h3>
              <span className="text-xs font-semibold text-slate-500">
                {templates.length || '0'} guardadas
              </span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {[activeTemplate, ...templates.filter(t => t.name !== activeTemplate.name)].map(t => (
                <div
                  key={t.name || 'active'}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    t.name === activeTemplate.name ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">{t.name || 'Sin nombre'}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {t.protagonistas} · {t.rangoPaginas.min}-{t.rangoPaginas.max} páginas
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2 flex-shrink-0">
                    <button
                      className="px-3 py-1 text-sm rounded-full bg-teal-600 text-white hover:bg-teal-500"
                      onClick={() => onSelect(t)}
                    >
                      Activar
                    </button>
                    <button
                      className="px-3 py-1 text-sm rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                      onClick={() => setForm(t)}
                    >
                      Editar
                    </button>
                    {t.name && (
                      <button
                        className="px-3 py-1 text-sm rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                        onClick={() => onDelete(t.name)}
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-sm text-slate-500">No hay plantillas guardadas aún.</p>
              )}
            </div>

            <div className="text-xs text-slate-500 leading-relaxed bg-white rounded-xl p-3 border border-slate-100">
              <p className="font-medium text-slate-600 mb-1">Consejo:</p>
              <p>Configura estilos e instrucciones diferentes para Tebeo y Brochure en cada plantilla.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
