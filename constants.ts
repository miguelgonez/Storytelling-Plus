import { TemplateConfig, PromptSet, OutputLanguage } from './types';

export const TEXT_MODEL = 'gemini-3-pro-preview';
export const IMAGE_MODEL = 'gemini-3-pro-image-preview';
export const VIDEO_MODEL = 'veo-2.0-generate-preview';

export const BASE_TEMPLATES: { id: string; name: string; description: string; config: TemplateConfig }[] = [
  {
    id: 'nexthealth-original',
    name: 'NextHealth Original',
    description: 'Formato estándar NextHealth (40-55 palabras/página, 8 páginas)',
    config: {
      name: 'NextHealth Original',
      protagonistas: 'Ana, una científica experta que explica con claridad, y Alex, un observador curioso que hace preguntas',
      tono: 'científico pero accesible, educativo, narrativo con diálogo entre personajes',
      rangoPaginas: { min: 8, max: 8 },
      densidadPalabras: { min: 40, max: 55 },
      idioma: 'español',
      tebeo: {
        estilo: 'Viñeta única estilo cómic educativo europeo, colores vibrantes, personajes expresivos en entornos científicos (laboratorios, pantallas, tecnología). Ana como científica profesional, Alex como observador atento. Escenas con elementos visuales del tema (microscopios, gráficos, dispositivos)',
        instrucciones: 'Cada imagen muestra UNA escena de diálogo entre Ana explicando y Alex escuchando/preguntando. Fondos con elementos científicos relevantes al tema.',
      },
      brochure: {
        estilo: 'Fotografía profesional estilo editorial científico, personas reales en entornos de laboratorio o clínicos, iluminación natural, composición tipo revista de divulgación científica',
        instrucciones: '',
      },
    },
  },
  {
    id: 'minimal',
    name: 'Mínimo',
    description: 'Texto breve y conciso (30-60 palabras/página)',
    config: {
      name: 'Plantilla Mínima',
      protagonistas: 'Un profesional de salud amigable',
      tono: 'directo, claro y accesible',
      rangoPaginas: { min: 4, max: 6 },
      densidadPalabras: { min: 30, max: 60 },
      idioma: 'español',
      tebeo: {
        estilo: 'Viñetas simples y coloridas, personajes amigables, diseño limpio tipo infografía visual',
        instrucciones: '',
      },
      brochure: {
        estilo: 'Fotografía profesional minimalista, mucho espacio en blanco, composición elegante',
        instrucciones: '',
      },
    },
  },
  {
    id: 'normal',
    name: 'Normal',
    description: 'Densidad equilibrada (70-120 palabras/página)',
    config: {
      name: 'NextHealth Storytelling',
      protagonistas: 'Ana, una experta en salud, y Alex, un paciente curioso',
      tono: 'informativo, empático y visualmente atractivo',
      rangoPaginas: { min: 6, max: 10 },
      densidadPalabras: { min: 70, max: 120 },
      idioma: 'español',
      tebeo: {
        estilo: 'Viñetas amigables estilo tebeo español tradicional, personajes expresivos con líneas definidas, colores vibrantes y cálidos, burbujas de diálogo integradas, narrativa visual como los clásicos TBO',
        instrucciones: '',
      },
      brochure: {
        estilo: 'Fotografía 2D profesional estilo banco de imágenes (stock photo), personas reales fotografiadas, iluminación natural de estudio, composición de folleto médico corporativo, estética de clínica privada premium',
        instrucciones: '',
      },
    },
  },
  {
    id: 'detailed',
    name: 'Detallado',
    description: 'Explicaciones completas (100-180 palabras/página)',
    config: {
      name: 'Guía Detallada de Salud',
      protagonistas: 'Dr. García, especialista médico, y María, educadora de pacientes',
      tono: 'educativo, detallado y profesional',
      rangoPaginas: { min: 8, max: 15 },
      densidadPalabras: { min: 100, max: 180 },
      idioma: 'español',
      tebeo: {
        estilo: 'Estilo cómic educativo con paneles informativos, personajes profesionales, diseño tipo manual ilustrado',
        instrucciones: '',
      },
      brochure: {
        estilo: 'Fotografía editorial de alta calidad, estilo revista médica profesional, composición informativa',
        instrucciones: '',
      },
    },
  },
  {
    id: 'comprehensive',
    name: 'Muy Detallado',
    description: 'Máximo detalle (150-250 palabras/página)',
    config: {
      name: 'Manual Completo de Salud',
      protagonistas: 'Equipo multidisciplinar de profesionales sanitarios',
      tono: 'exhaustivo, científico pero accesible, muy informativo',
      rangoPaginas: { min: 10, max: 20 },
      densidadPalabras: { min: 150, max: 250 },
      idioma: 'español',
      tebeo: {
        estilo: 'Estilo cómic técnico-educativo, rico en detalles, personajes profesionales diversos, diseño tipo guía ilustrada completa',
        instrucciones: '',
      },
      brochure: {
        estilo: 'Fotografía documental médica profesional, estilo libro de texto ilustrado, composición didáctica',
        instrucciones: '',
      },
    },
  },
];

export const DEFAULT_TEMPLATE: TemplateConfig = BASE_TEMPLATES[0].config; // NextHealth Original por defecto

export const buildPromptsFromTemplate = (template: TemplateConfig, outputLanguage?: OutputLanguage): PromptSet => {
  const { min, max } = template.rangoPaginas;
  const densidad = template.densidadPalabras || { min: 70, max: 120 };
  const pagesText = min === max
    ? `exactamente ${min} páginas`
    : `entre ${min} y ${max} páginas`;

  const idioma = outputLanguage || template.idioma;

  const tebeoInstructions = template.tebeo.instrucciones?.trim() 
    ? `\n\nINSTRUCCIONES ESPECÍFICAS PARA TEBEO (prioridad alta): ${template.tebeo.instrucciones.trim()}`
    : '';

  const brochureInstructions = template.brochure.instrucciones?.trim() 
    ? `\n\nINSTRUCCIONES ESPECÍFICAS PARA BROCHURE (prioridad alta): ${template.brochure.instrucciones.trim()}`
    : '';

  return {
    analysisPrompt: `Analiza este documento de salud en profundidad y genera un resumen COMPLETO y DETALLADO en ${idioma}.

Usa a ${template.protagonistas} como protagonistas narradores con tono ${template.tono}.

EXTRAE Y RESUME:
1. Objetivo principal del documento
2. Público objetivo
3. Todas las secciones o temas clave (no omitas ninguno importante)
4. Conceptos, datos o estadísticas relevantes
5. Recomendaciones o mensajes accionables
6. Conclusiones

IMPORTANTE: 
- El resumen debe ser EXHAUSTIVO, cubriendo TODO el contenido significativo del PDF
- Mínimo 500 palabras de resumen
- Todo en ${idioma}`,
    planningPrompt: `Con base en el análisis anterior, diseña una historia visual educativa COMPLETA donde ${template.protagonistas} explican TODO el contenido al lector.

REGLAS DE PAGINACIÓN:
- Usa TANTAS PÁGINAS como sea necesario para cubrir todo el contenido (típicamente ${min}-${max} páginas, pero puedes usar MÁS si el contenido lo requiere)
- NO comprimas ni omitas información importante
- Cada concepto o sección relevante merece su propia página
- Es preferible tener más páginas con contenido claro que pocas páginas sobrecargadas

CADA PÁGINA debe tener:
- "description": Un PÁRRAFO SUSTANCIAL de 4-6 oraciones (${densidad.min}-${densidad.max} palabras) que explique claramente el concepto de esa página. Este texto aparece DEBAJO de la imagen.
- "visualCue": Una descripción breve de la escena visual para la ilustración (SIN texto en la imagen)

IMPORTANTE:
- Todo el contenido narrativo en ${idioma}
- Las descripciones deben ser informativas y educativas, no superficiales
- Cubre TODOS los temas del análisis, sin omitir secciones

Devuelve un array JSON con todas las páginas necesarias.`,
    tebeoPrefix: `Genera una ilustración estilo TEBEO/VIÑETAS AMIGABLES de alta calidad. Protagonistas: ${template.protagonistas}. 

ESTILO VISUAL: ${template.tebeo.estilo}

REGLAS DE COMPOSICIÓN:
- Máximo 1-2 burbujas de diálogo con texto MUY BREVE (5-10 palabras máximo por burbuja)
- Un solo concepto o escena por imagen
- Composición limpia y despejada, mucho espacio visual
- Personajes grandes y expresivos como foco principal
- Fondo simple, no recargado
- Todo texto en ${idioma}, sin errores ortográficos

EVITAR:
- Múltiples secciones o paneles en una imagen
- Listas, viñetas o párrafos largos
- Texto pequeño o denso
- Infografías complejas

La imagen debe parecer UNA VIÑETA de tebeo, no una página completa.${tebeoInstructions}`,
    brochurePrefix: `Genera una FOTOGRAFÍA 2D PLANA estilo STOCK PHOTO / BANCO DE IMÁGENES para un FOLLETO de salud. 

Protagonistas: ${template.protagonistas} (personas REALES fotografiadas).

ESTILO VISUAL: ${template.brochure.estilo}

REGLAS DE COMPOSICIÓN:
- Máximo UN título corto (3-6 palabras) si es necesario
- Un solo concepto o escena por imagen
- Composición limpia tipo fotografía publicitaria
- Personas como foco principal, fondo simple
- SOLO fotografía 2D plana (estilo Shutterstock, Getty)
- Todo texto en ${idioma}, sin errores ortográficos

EVITAR:
- Múltiples secciones, paneles o recuadros
- Listas, viñetas o párrafos de texto
- Infografías, diagramas o esquemas
- Renderizado 3D, CGI, ilustraciones o estilo videojuego
- Pantallas con texto largo

La imagen debe parecer UNA FOTO de banco de imágenes profesional para folleto médico.${brochureInstructions}`,
    idioma: idioma,
    densidadPalabras: densidad,
  };
};
