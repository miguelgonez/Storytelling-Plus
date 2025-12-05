import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PagePlan, StoryPage, PromptSet, VideoPage } from "../types";
import { TEXT_MODEL, IMAGE_MODEL, VIDEO_MODEL } from "../constants";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 4,
  baseDelay: number = 3000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || error?.toString() || JSON.stringify(error);
      
      const isRetryable = 
        errorMessage.includes('503') || 
        errorMessage.includes('overloaded') || 
        errorMessage.includes('UNAVAILABLE') ||
        errorMessage.includes('Load failed') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('TypeError');
      
      if (isRetryable && attempt < maxRetries - 1) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.log(`Error de conexión, reintentando en ${waitTime/1000}s... (intento ${attempt + 1}/${maxRetries})`);
        await delay(waitTime);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

/**
 * Step 1: Analyze the paper and get the main idea.
 */
export const analyzePaper = async (
  fileBase64: string,
  mimeType: string,
  prompts: PromptSet
): Promise<string> => {
  const ai = getAIClient();
  
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: fileBase64
              }
            },
            { text: prompts.analysisPrompt }
          ]
        }
      });

      return response.text || "Failed to generate analysis.";
    } catch (error) {
      console.error("Analysis Error:", error);
      throw error;
    }
  });
};

/**
 * Step 2: Plan the storybook pages.
 */
export const planStory = async (analysisContext: string, prompts: PromptSet): Promise<PagePlan[]> => {
  const ai = getAIClient();

  // Extract text regardless of SDK shape (method vs property)
  const extractText = (response: any): string => {
    if (!response) return "";
    if (typeof response.text === "function") return response.text();
    if (typeof response.text === "string") return response.text;
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const texts = parts
      .map((p: any) => (p.text ? p.text : ""))
      .filter(Boolean);
    return texts.join("\n");
  };

  const parsePlan = (raw: string): PagePlan[] => {
    const clean = raw.trim();
    const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : clean;
    const start = candidate.indexOf("[");
    const end = candidate.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1)) as PagePlan[];
    }
    return JSON.parse(candidate) as PagePlan[];
  };

  const validateAndTrimDescriptions = (plans: PagePlan[], densidad?: { min: number; max: number }): PagePlan[] => {
    const MAX_WORDS = densidad ? densidad.max + 30 : 150;
    const TARGET_WORDS = densidad ? densidad.max : 120;
    
    return plans.map(plan => {
      const words = plan.description.trim().split(/\s+/);
      const wordCount = words.length;
      
      if (wordCount <= MAX_WORDS) {
        console.log(`Page ${plan.pageNumber}: ${wordCount} words - OK`);
        return plan;
      }
      
      console.warn(`Page ${plan.pageNumber}: ${wordCount} words - TRIMMING to ${TARGET_WORDS}`);
      
      const trimmedWords = words.slice(0, TARGET_WORDS);
      let trimmedDescription = trimmedWords.join(' ');
      
      if (!trimmedDescription.endsWith('.') && !trimmedDescription.endsWith('!') && !trimmedDescription.endsWith('?')) {
        const lastSentenceEnd = Math.max(
          trimmedDescription.lastIndexOf('.'),
          trimmedDescription.lastIndexOf('!'),
          trimmedDescription.lastIndexOf('?')
        );
        
        if (lastSentenceEnd > trimmedDescription.length * 0.5) {
          trimmedDescription = trimmedDescription.substring(0, lastSentenceEnd + 1);
        } else {
          trimmedDescription += '.';
        }
      }
      
      return {
        ...plan,
        description: trimmedDescription
      };
    });
  };

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        pageNumber: { type: Type.INTEGER },
        description: { type: Type.STRING, description: "The narrative content of this page" },
        visualCue: { type: Type.STRING, description: "Description of the visual scene for the image generator" }
      },
      required: ["pageNumber", "description", "visualCue"]
    }
  };

  return withRetry(async () => {
    try {
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
          responseSchema: schema,
        }
      });

      const text = extractText(response);
      if (!text) throw new Error("No plan generated");

      try {
        const parsed = parsePlan(text);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Empty plan received");
        }
        
        console.log("Validating descriptions with density config...");
        const validated = validateAndTrimDescriptions(parsed, prompts.densidadPalabras);
        
        return validated;
      } catch (parseErr: any) {
        console.error("Planning parse error", parseErr, text);
        throw new Error("No se pudo leer el plan devuelto por Gemini. Intenta de nuevo o ajusta el PDF.");
      }
    } catch (error) {
      console.error("Planning Error:", error);
      throw error;
    }
  });
};

/**
 * Step 3: Generate a single page image in Tebeo (comic) style.
 */
export const generateTebeoPage = async (
  context: string,
  pagePlan: PagePlan,
  prompts: PromptSet
): Promise<StoryPage> => {
  const ai = getAIClient();
  
  const prompt = `${prompts.tebeoPrefix}. Página ${pagePlan.pageNumber} (relación 2:3 en vertical, idioma ${prompts.idioma}).
  
  Contexto: ${context}
  
  Descripción de la página: ${pagePlan.description}
  Escena visual: ${pagePlan.visualCue}`;

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
              aspectRatio: "3:4", 
          }
        }
      });

      let imageUrl = '';
      
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break; 
          }
        }
      }

      if (!imageUrl) {
          throw new Error(`No image generated for page ${pagePlan.pageNumber}`);
      }

      return {
        pageNumber: pagePlan.pageNumber,
        imageUrl: imageUrl,
        description: pagePlan.description
      };

    } catch (error) {
      console.error(`Tebeo Generation Error (Page ${pagePlan.pageNumber}):`, error);
      throw error;
    }
  });
};

/**
 * Step 3 Alt: Generate a single page image in Brochure (photorealistic) style.
 */
export const generateBrochurePage = async (
  context: string,
  pagePlan: PagePlan,
  prompts: PromptSet
): Promise<StoryPage> => {
  const ai = getAIClient();
  
  const prompt = `${prompts.brochurePrefix}. Página ${pagePlan.pageNumber} (relación 2:3 en vertical, idioma ${prompts.idioma}).
  
  Contexto: ${context}
  
  Descripción de la página: ${pagePlan.description}
  Escena visual: ${pagePlan.visualCue}`;

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
              aspectRatio: "3:4", 
          }
        }
      });

      let imageUrl = '';
      
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break; 
          }
        }
      }

      if (!imageUrl) {
          throw new Error(`No image generated for page ${pagePlan.pageNumber}`);
      }

      return {
        pageNumber: pagePlan.pageNumber,
        imageUrl: imageUrl,
        description: pagePlan.description
      };

    } catch (error) {
      console.error(`Brochure Generation Error (Page ${pagePlan.pageNumber}):`, error);
      throw error;
    }
  });
};

