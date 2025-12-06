# Cómo genera las imágenes el código

## Resumen del flujo

El sistema transforma un PDF de salud en una historia visual siguiendo **4 pasos secuenciales**:

```
PDF → Análisis → Planificación → Generación de Imágenes → Resultado Final
```

---

## Arquitectura del sistema

### Modelos de IA utilizados

| Modelo | Propósito | Definido en |
|--------|-----------|-------------|
| `gemini-3-pro-preview` | Análisis de texto y planificación | `TEXT_MODEL` |
| `gemini-3-pro-image-preview` | Generación de imágenes | `IMAGE_MODEL` |

### Archivo principal: `services/geminiService.ts`

---

## Paso 1: Análisis del PDF (`analyzePaper`)

### Entrada
- `fileBase64`: El PDF codificado en Base64
- `mimeType`: Tipo MIME (normalmente `application/pdf`)
- `prompts`: Configuración de prompts desde la plantilla

### Proceso
```typescript
const response = await ai.models.generateContent({
  model: TEXT_MODEL,  // gemini-3-pro-preview
  contents: {
    parts: [
      {
        inlineData: {
          mimeType: mimeType,
          data: fileBase64  // PDF en Base64
        }
      },
      { text: prompts.analysisPrompt }  // Prompt de análisis
    ]
  }
});
```

### Prompt de análisis (desde `constants.ts`)
```
Analiza este documento de salud en profundidad y genera un resumen COMPLETO y DETALLADO en ${idioma}.

Usa a ${protagonistas} como protagonistas narradores con tono ${tono}.

EXTRAE Y RESUME:
1. Objetivo principal del documento
2. Público objetivo
3. Todas las secciones o temas clave
4. Conceptos, datos o estadísticas relevantes
5. Recomendaciones o mensajes accionables
6. Conclusiones

IMPORTANTE: 
- El resumen debe ser EXHAUSTIVO (mínimo 500 palabras)
- Todo en ${idioma}
```

### Salida
Un texto de análisis completo (string) que sirve como contexto para la planificación.

---

## Paso 2: Planificación de páginas (`planStory`)

### Entrada
- `analysisContext`: El análisis generado en el paso 1
- `prompts`: Configuración de prompts

### Proceso
```typescript
const response = await ai.models.generateContent({
  model: TEXT_MODEL,
  contents: {
    parts: [
      { text: `Context: ${analysisContext}` },
      { text: prompts.planningPrompt }
    ]
  },
  config: {
    responseMimeType: "application/json",
    responseSchema: schema  // Esquema JSON estructurado
  }
});
```

### Esquema JSON de salida
```typescript
{
  type: ARRAY,
  items: {
    type: OBJECT,
    properties: {
      pageNumber: { type: INTEGER },
      description: { type: STRING },  // Texto narrativo (40-55 palabras)
      visualCue: { type: STRING }     // Descripción visual para la imagen
    }
  }
}
```

### Prompt de planificación
```
Con base en el análisis anterior, diseña una historia visual educativa COMPLETA 
donde ${protagonistas} explican TODO el contenido al lector.

REGLAS DE PAGINACIÓN:
- Usa TANTAS PÁGINAS como sea necesario (típicamente ${min}-${max} páginas)
- NO comprimas ni omitas información importante

CADA PÁGINA debe tener:
- "description": Un PÁRRAFO de ${densidad.min}-${densidad.max} palabras
- "visualCue": Descripción breve de la escena visual
```

### Validación de densidad
Después de recibir el plan, el sistema valida y recorta las descripciones:

```typescript
const validateAndTrimDescriptions = (plans, densidad) => {
  const MAX_WORDS = densidad.max + 30;  // Margen de tolerancia
  const TARGET_WORDS = densidad.max;
  
  return plans.map(plan => {
    const words = plan.description.split(/\s+/);
    
    if (words.length <= MAX_WORDS) {
      return plan;  // OK, no recortar
    }
    
    // Recortar al objetivo
    const trimmedWords = words.slice(0, TARGET_WORDS);
    let trimmedDescription = trimmedWords.join(' ');
    
    // Asegurar que termina en punto
    if (!trimmedDescription.endsWith('.')) {
      trimmedDescription += '.';
    }
    
    return { ...plan, description: trimmedDescription };
  });
};
```

### Salida
Array de `PagePlan[]`:
```typescript
[
  {
    pageNumber: 1,
    description: "En un laboratorio de alta tecnología, Alex observa...",
    visualCue: "Laboratorio moderno con pantalla gigante mostrando mosquito"
  },
  // ... más páginas
]
```

---

## Paso 3: Generación de imágenes

### Dos modos disponibles

#### Modo TEBEO (`generateTebeoPage`)

```typescript
const prompt = `${prompts.tebeoPrefix}. Página ${pagePlan.pageNumber} 
(relación 2:3 en vertical, idioma ${prompts.idioma}).

Contexto: ${context}

Descripción de la página: ${pagePlan.description}
Escena visual: ${pagePlan.visualCue}`;

const response = await ai.models.generateContent({
  model: IMAGE_MODEL,  // gemini-3-pro-image-preview
  contents: {
    parts: [{ text: prompt }]
  },
  config: {
    imageConfig: {
      aspectRatio: "3:4"  // Formato vertical
    }
  }
});
```

**Prefix de Tebeo (ejemplo NextHealth Original):**
```
Genera una ilustración estilo TEBEO/VIÑETAS AMIGABLES de alta calidad.
Protagonistas: Ana, una científica experta, y Alex, un observador curioso.

ESTILO VISUAL: Viñeta única estilo cómic educativo europeo, colores vibrantes,
personajes expresivos en entornos científicos.

REGLAS DE COMPOSICIÓN:
- Máximo 1-2 burbujas de diálogo con texto MUY BREVE (5-10 palabras)
- Un solo concepto o escena por imagen
- Composición limpia y despejada
- Personajes grandes y expresivos
- Fondo simple, no recargado

EVITAR:
- Múltiples secciones o paneles
- Listas, viñetas o párrafos largos
- Texto pequeño o denso
```

#### Modo BROCHURE (`generateBrochurePage`)

```typescript
const prompt = `${prompts.brochurePrefix}. Página ${pagePlan.pageNumber}
(relación 2:3 en vertical, idioma ${prompts.idioma}).

Contexto: ${context}

Descripción de la página: ${pagePlan.description}
Escena visual: ${pagePlan.visualCue}`;
```

**Prefix de Brochure:**
```
Genera una FOTOGRAFÍA 2D PLANA estilo STOCK PHOTO para un FOLLETO de salud.
Protagonistas: ${protagonistas} (personas REALES fotografiadas).

ESTILO VISUAL: Fotografía profesional estilo banco de imágenes,
iluminación natural de estudio, composición de folleto médico corporativo.

REGLAS DE COMPOSICIÓN:
- Máximo UN título corto (3-6 palabras)
- SOLO fotografía 2D plana (estilo Shutterstock, Getty)

EVITAR:
- Renderizado 3D, CGI, ilustraciones
- Infografías, diagramas o esquemas
```

### Extracción de la imagen

```typescript
let imageUrl = '';

if (response.candidates?.[0]?.content?.parts) {
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      // La imagen viene en Base64
      imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      break;
    }
  }
}
```

### Salida por página
```typescript
{
  pageNumber: 1,
  imageUrl: "data:image/png;base64,iVBORw0KGgo...",  // Imagen en Base64
  description: "En un laboratorio de alta tecnología..."
}
```

---

## Mecanismo de reintentos (`withRetry`)

El sistema incluye tolerancia a fallos con reintentos exponenciales:

```typescript
const withRetry = async (fn, maxRetries = 4, baseDelay = 3000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = 
        error.includes('503') ||           // Servidor sobrecargado
        error.includes('overloaded') ||    // Modelo ocupado
        error.includes('UNAVAILABLE') ||   // Servicio no disponible
        error.includes('Load failed') ||   // Fallo de carga
        error.includes('network') ||       // Error de red
        error.includes('timeout');         // Timeout
      
      if (isRetryable && attempt < maxRetries - 1) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        // Espera: 3s → 6s → 12s → 24s
        await delay(waitTime);
        continue;
      }
      
      throw error;
    }
  }
};
```

### Tiempos de espera
| Intento | Espera |
|---------|--------|
| 1 | 3 segundos |
| 2 | 6 segundos |
| 3 | 12 segundos |
| 4 | 24 segundos |

---

## Flujo completo en App.tsx

```typescript
// 1. Analizar PDF
const analysis = await analyzePaper(fileBase64, mimeType, prompts);

// 2. Planificar páginas
const plan = await planStory(analysis, prompts);

// 3. Generar imágenes (página por página)
const pages: StoryPage[] = [];

for (const pagePlan of plan) {
  const page = outputMode === 'tebeo'
    ? await generateTebeoPage(analysis, pagePlan, prompts)
    : await generateBrochurePage(analysis, pagePlan, prompts);
  
  pages.push(page);
  
  // Actualizar progreso en UI
  updateProgress(page.pageNumber, plan.length);
}

// 4. Mostrar resultado
setStoryPages(pages);
```

---

## Configuración de densidad por plantilla

| Plantilla | Palabras/página | Páginas |
|-----------|-----------------|---------|
| NextHealth Original | 40-55 | 8 |
| Mínimo | 30-60 | 4-6 |
| Normal | 70-120 | 6-10 |
| Detallado | 100-180 | 8-15 |
| Muy Detallado | 150-250 | 10-20 |

La densidad se pasa al prompt de planificación y luego se valida/recorta automáticamente.

---

## Diagrama de flujo visual

```
┌─────────────────┐
│   PDF Upload    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────────────────┐
│  analyzePaper   │────▶│ Gemini TEXT_MODEL                │
│                 │     │ - Recibe PDF en Base64           │
│                 │     │ - Genera análisis exhaustivo     │
└────────┬────────┘     └──────────────────────────────────┘
         │
         │ analysisContext (texto)
         ▼
┌─────────────────┐     ┌──────────────────────────────────┐
│   planStory     │────▶│ Gemini TEXT_MODEL                │
│                 │     │ - Recibe análisis + prompt       │
│                 │     │ - Genera JSON con páginas        │
│                 │     │ - Valida densidad de palabras    │
└────────┬────────┘     └──────────────────────────────────┘
         │
         │ PagePlan[] (array de páginas)
         ▼
┌─────────────────┐     ┌──────────────────────────────────┐
│ generatePage    │────▶│ Gemini IMAGE_MODEL               │
│ (loop por cada  │     │ - Recibe prompt + visualCue      │
│  página)        │     │ - Genera imagen Base64           │
│                 │     │ - Aspect ratio 3:4               │
└────────┬────────┘     └──────────────────────────────────┘
         │
         │ StoryPage[] (imágenes + descripciones)
         ▼
┌─────────────────┐
│  Renderizado    │
│  en visor       │
└─────────────────┘
```

---

## Archivos clave

| Archivo | Función |
|---------|---------|
| `services/geminiService.ts` | Lógica de generación (análisis, plan, imágenes) |
| `constants.ts` | Modelos, plantillas base, construcción de prompts |
| `types.ts` | Tipos TypeScript (PagePlan, StoryPage, PromptSet) |
| `App.tsx` | Orquestación del flujo completo |
| `components/TemplateManager.tsx` | UI para configurar plantillas |
