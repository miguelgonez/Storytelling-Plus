import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY not found in environment variables');
}

const ai = new GoogleGenAI({ apiKey });

const VEO_MODEL = 'veo-2.0-generate-preview';

export async function generateVideoWithDialogue(visualPrompt, dialogue, aspectRatio = '16:9', language = 'español') {
  console.log('Starting video generation with Veo 2.0...');
  
  const fullPrompt = buildLipSyncPrompt(visualPrompt, dialogue, language);
  console.log('Full prompt with dialogue:', fullPrompt.substring(0, 200) + '...');
  
  try {
    let operation = await ai.models.generateVideos({
      model: VEO_MODEL,
      prompt: fullPrompt,
      config: {
        aspectRatio: aspectRatio,
        numberOfVideos: 1,
      },
    });

    console.log('Video generation started, polling for completion...');
    
    let pollCount = 0;
    const maxPolls = 60;
    
    while (!operation.done && pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      pollCount++;
      console.log(`Poll ${pollCount}/${maxPolls}...`, operation.done ? 'DONE' : 'PENDING');
    }
    
    if (!operation.done) {
      throw new Error('Video generation timed out after 10 minutes');
    }

    console.log('Video generation complete');
    
    if (operation.response && operation.response.generatedVideos && operation.response.generatedVideos.length > 0) {
      const video = operation.response.generatedVideos[0];
      
      if (video.video && video.video.uri) {
        console.log('Video URI received (with native audio)');
        return { type: 'uri', data: video.video.uri, hasNativeAudio: true };
      }
      
      if (video.video && video.video.videoBytes) {
        console.log('Video bytes received (with native audio)');
        return { type: 'bytes', data: video.video.videoBytes, hasNativeAudio: true };
      }
    }
    
    throw new Error('No video data in response');
  } catch (error) {
    console.error('Veo 3.1 API error:', error);
    throw error;
  }
}

function buildLipSyncPrompt(visualPrompt, dialogue, language) {
  const languageInstruction = language === 'español' 
    ? 'El personaje habla en español latinoamericano claro.'
    : `The character speaks in clear ${language}.`;
  
  const lipSyncGuardrails = `
CRITICAL LIP SYNC REQUIREMENTS:
- Medium close-up or close-up framing showing the character's face clearly
- Character's mouth movements MUST be visible and synchronized with speech
- Maintain eye contact with camera during speech
- Natural head movements while speaking
- Clear articulation visible in mouth movements
`;

  const audioInstruction = `
AUDIO REQUIREMENTS:
- Clear, professional voice matching the character
- Ambient educational setting sounds (soft, non-distracting)
- No background music during dialogue
`;

  const dialoguePart = dialogue && dialogue.length > 0
    ? `\n\nThe character says: "${dialogue}"\n${languageInstruction}`
    : '';

  return `${visualPrompt}

${lipSyncGuardrails}
${audioInstruction}
${dialoguePart}

Style: Educational health documentary, warm and engaging tone, professional but approachable.`;
}

export async function generateVideo(prompt, aspectRatio = '16:9') {
  console.log('Starting video generation with Veo 2.0...');
  console.log('Prompt:', prompt.substring(0, 100) + '...');
  
  try {
    let operation = await ai.models.generateVideos({
      model: VEO_MODEL,
      prompt: prompt,
      config: {
        aspectRatio: aspectRatio,
        numberOfVideos: 1,
      },
    });

    console.log('Video generation started, polling for completion...');
    
    let pollCount = 0;
    const maxPolls = 60;
    
    while (!operation.done && pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      pollCount++;
      console.log(`Poll ${pollCount}/${maxPolls}...`, operation.done ? 'DONE' : 'PENDING');
    }
    
    if (!operation.done) {
      throw new Error('Video generation timed out after 10 minutes');
    }

    console.log('Video generation complete');
    
    if (operation.response && operation.response.generatedVideos && operation.response.generatedVideos.length > 0) {
      const video = operation.response.generatedVideos[0];
      
      if (video.video && video.video.uri) {
        console.log('Video URI received');
        return { type: 'uri', data: video.video.uri, hasNativeAudio: true };
      }
      
      if (video.video && video.video.videoBytes) {
        console.log('Video bytes received');
        return { type: 'bytes', data: video.video.videoBytes, hasNativeAudio: true };
      }
    }
    
    throw new Error('No video data in response');
  } catch (error) {
    console.error('Veo API error:', error);
    throw error;
  }
}

export function validateLipSyncRequirements(dialogue) {
  const errors = [];
  const warnings = [];
  
  if (!dialogue || dialogue.trim().length === 0) {
    errors.push('No dialogue provided for lip sync');
  }
  
  const wordCount = dialogue ? dialogue.trim().split(/\s+/).length : 0;
  const charCount = dialogue ? dialogue.length : 0;
  
  if (charCount > 500) {
    errors.push(`Diálogo muy largo: ${charCount} caracteres (máximo 500)`);
  }
  
  if (wordCount > 60) {
    errors.push(`Demasiadas palabras: ${wordCount} (máximo 60 para lip sync claro)`);
  } else if (wordCount > 50) {
    warnings.push(`Advertencia: ${wordCount} palabras está cerca del límite. Considera reducir a ~35-45 palabras para mejor sincronización.`);
  }
  
  const estimatedDuration = wordCount * 0.4;
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    wordCount,
    charCount,
    estimatedDuration: Math.ceil(estimatedDuration),
    optimalRange: { min: 35, max: 45 }
  };
}
