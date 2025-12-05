import Replicate from 'replicate';

const apiToken = process.env.REPLICATE_API_TOKEN;

if (!apiToken) {
  console.warn('REPLICATE_API_TOKEN not found - video generation will not work');
}

const replicate = new Replicate({
  auth: apiToken,
});

const HAILUO_MODEL = 'minimax/video-01';

export async function generateVideoWithWan(visualPrompt, dialogue, resolution = '480p', language = 'español') {
  console.log(`Starting video generation with Hailuo (photorealistic mode)...`);
  
  const fullPrompt = buildRealisticPrompt(visualPrompt, dialogue, language);
  console.log('Prompt:', fullPrompt.substring(0, 150) + '...');
  
  try {
    console.log(`Using model: ${HAILUO_MODEL}`);
    
    const output = await replicate.run(HAILUO_MODEL, {
      input: {
        prompt: fullPrompt,
        prompt_optimizer: true,
      }
    });
    
    console.log('Hailuo generation complete');
    console.log('Output type:', typeof output);
    
    let videoUrl;
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (output && output.url) {
      videoUrl = output.url();
    } else if (Array.isArray(output) && output.length > 0) {
      videoUrl = typeof output[0] === 'string' ? output[0] : output[0].url?.();
    } else {
      console.log('Raw output:', output);
      throw new Error('Could not extract video URL from response');
    }
    
    console.log('Video URL:', videoUrl);
    
    return { 
      type: 'url', 
      data: videoUrl,
      hasNativeAudio: false,
      model: 'hailuo'
    };
    
  } catch (error) {
    console.error('Hailuo API error:', error);
    throw error;
  }
}

export async function generateImageToVideo(imageUrl, prompt, resolution = '480p', language = 'español') {
  console.log(`Starting image-to-video with Hailuo (photorealistic mode)...`);
  
  const fullPrompt = buildRealisticPrompt(prompt, null, language);
  
  try {
    const output = await replicate.run('minimax/video-01-live', {
      input: {
        image: imageUrl,
        prompt: fullPrompt,
        prompt_optimizer: true,
      }
    });
    
    let videoUrl;
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (output && output.url) {
      videoUrl = output.url();
    } else if (Array.isArray(output) && output.length > 0) {
      videoUrl = typeof output[0] === 'string' ? output[0] : output[0].url?.();
    }
    
    return { 
      type: 'url', 
      data: videoUrl,
      hasNativeAudio: false,
      model: 'hailuo'
    };
    
  } catch (error) {
    console.error('Hailuo I2V error:', error);
    throw error;
  }
}

function buildRealisticPrompt(visualPrompt, dialogue, language) {
  let prompt = visualPrompt;
  
  if (dialogue && dialogue.length > 0) {
    const cleanDialogue = dialogue.replace(/["""]/g, '');
    prompt += `. The person is naturally speaking: "${cleanDialogue}"`;
  }
  
  prompt += '. Photorealistic footage, real human actors, natural lighting, documentary-style cinematography, professional camera work, lifelike movements, authentic expressions, high-fidelity details, shot on cinema camera, shallow depth of field.';
  
  if (language === 'español') {
    prompt += ' Latin American setting, warm natural colors, professional medical documentary aesthetic.';
  }
  
  return prompt;
}

export function validateVideoRequest(narrationText) {
  const warnings = [];
  
  if (narrationText && narrationText.length > 0) {
    const wordCount = narrationText.trim().split(/\s+/).length;
    
    if (wordCount > 60) {
      warnings.push(`Texto largo (${wordCount} palabras). Considera reducir para mejor resultado visual.`);
    }
  }
  
  return {
    valid: true,
    warnings,
    model: 'Hailuo (Photorealistic)'
  };
}
