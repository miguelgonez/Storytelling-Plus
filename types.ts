export interface PagePlan {
  pageNumber: number;
  description: string;
  visualCue: string;
}

export interface StoryPage {
  pageNumber: number;
  imageUrl: string;
  description: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  PLANNING = 'PLANNING',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface ProcessingState {
  status: AppStatus;
  currentStepDescription?: string;
  progress: number; // 0 to 100
  totalSteps: number;
  currentStep: number;
  error?: string;
}

export interface ModeConfig {
  estilo: string;
  instrucciones: string;
}

export interface TemplateConfig {
  name: string;
  protagonistas: string;
  tono: string;
  rangoPaginas: {
    min: number;
    max: number;
  };
  densidadPalabras: {
    min: number;
    max: number;
  };
  idioma: string;
  tebeo: ModeConfig;
  brochure: ModeConfig;
}

export interface PromptSet {
  analysisPrompt: string;
  planningPrompt: string;
  tebeoPrefix: string;
  brochurePrefix: string;
  idioma: string;
  densidadPalabras: {
    min: number;
    max: number;
  };
  customInstructions?: string;
}

export interface VideoPage {
  pageNumber: number;
  videoUrl: string;
  description: string;
  duration: number;
}

export type OutputMode = 'tebeo' | 'brochure';

export type OutputLanguage = 'español' | 'inglés' | 'francés' | 'alemán' | 'árabe';

export const AVAILABLE_LANGUAGES: { value: OutputLanguage; label: string; flag: string }[] = [
  { value: 'español', label: 'Español', flag: '🇪🇸' },
  { value: 'inglés', label: 'English', flag: '🇬🇧' },
  { value: 'francés', label: 'Français', flag: '🇫🇷' },
  { value: 'alemán', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'árabe', label: 'العربية', flag: '🇸🇦' },
];

export interface VideoPlan {
  sceneNumber: number;
  description: string;
  visualCue: string;
  durationSeconds: number;
}
