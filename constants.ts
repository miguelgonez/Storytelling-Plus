import { TemplateConfig, PromptSet, OutputLanguage } from './types';

export const TEXT_MODEL = 'gemini-3-pro-preview';
export const IMAGE_MODEL = 'gemini-3-pro-image-preview';
export const VIDEO_MODEL = 'veo-2.0-generate-preview';

export const DEFAULT_TEMPLATE: TemplateConfig = {
  name: 'NextHealth Storytelling',
  protagonistas: 'Ana, una experta en salud, y Alex, un paciente curioso',
  tono: 'informativo, empático y visualmente atractivo',
  rangoPaginas: { min: 8, max: 8 },
  densidadPalabras: { min: 70, max: 120 },
  idioma: 'español',
  tebeo: {
    estilo: 'Viñetas amigables estilo tebeo español tradicional, personajes expresivos con líneas definidas, colores vibrantes y cálidos, burbujas de diálogo integradas, narrativa visual como los clásicos TBO',
    instrucciones: '',
  },
  brochure: {
    estilo: 'Fotografía 2D profesional estilo banco de imágenes (stock photo), personas reales fotografiadas, iluminación natural de estudio, composición de folleto médico corporativo, estética de clínica privada premium. IMPORTANTE: Solo fotografía 2D plana, NO renderizado 3D, NO CGI, NO ilustraciones, NO estilo videojuego',
    instrucciones: '',
  },
};

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
