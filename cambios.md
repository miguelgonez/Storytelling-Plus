# Cambios para adaptar la plataforma a otros roles y perfiles

Esta guía resume qué tocar para cambiar protagonistas, tono y contenido generado.

## 1) Prompts (archivo `constants.ts`)
- `PROMPT_ANALYSIS`: describe a los nuevos personajes y el tono. Ejemplo: “Usa a Ana (científica curiosa) y Lalo (robot asistente) como protagonistas; resume en español con tono didáctico”.
- `PROMPT_PLANNING`: indica que el plan use esos personajes y el rango de páginas deseado. Ejemplo: “Diseña un cómic educativo de 8 a 12 páginas donde Ana y Lalo guían al lector; devuelve narrativa breve y sugerencia visual”.
- `PROMPT_IMAGE_GENERATION_PREFIX`: especifica apariencia y lengua. Ejemplo: “Genera una página de cómic en español con Ana (bata azul, cabello rizado) y Lalo (robot pequeño con luz verde)”.

## 2) Textos de la UI (archivo `App.tsx`)
- Cambia el título, subtítulo y descripciones de pasos para reflejar los nuevos protagonistas.
- Ajusta mensajes de autenticación y botones si quieres otro wording.

## 3) Carga de archivos (archivo `components/FileUpload.tsx`)
- Actualiza textos de encabezado y botón si el flujo cambia.
- Puedes modificar `MAX_FILE_MB` si necesitas otro límite de tamaño.

## 4) Barra de progreso y visor (archivos `components/ProgressBar.tsx` y `components/ComicViewer.tsx`)
- Actualiza textos de estado y etiquetas de navegación si quieres otro tono o idioma.

## 5) Lógica de generación (archivo `services/geminiService.ts`)
- El prompt final usa el prefijo anterior y añade página, contexto y visual cues. Si requieres más control (p. ej., estilo de arte o proporción), ajusta aquí.

## 6) Idioma
- Todos los textos actuales están en español. Si cambias de idioma, actualiza UI y prompts en bloque para mantener coherencia.

## 7) Ambiente y arranque
- Coloca tu clave en `.env.local` como `GEMINI_API_KEY="tu-clave"`.
- Reinicia `npm run dev` tras editar `.env.local` o los prompts para que Vite cargue cambios.
- Scripts: `npm run dev` (puerto 4321), `npm run build`, `npm run preview`.

## 8) Validación rápida
- Prueba con un PDF pequeño (≤15 MB) y verifica que los textos reflejan los nuevos roles.
- Si Gemini devuelve menos páginas de las pedidas, revisa `PROMPT_PLANNING` y agrega instrucciones más estrictas.

## 9) Dónde buscar
- Prompts: `constants.ts`
- UI principal: `App.tsx`
- Componentes: `components/FileUpload.tsx`, `components/ProgressBar.tsx`, `components/ComicViewer.tsx`
- Llamadas a la API: `services/geminiService.ts`
