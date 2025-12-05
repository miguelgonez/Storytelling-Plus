import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { TMP_DIR } from './transcode.js';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY not found for TTS service');
}

const ai = new GoogleGenAI({ apiKey });

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const VOICES = {
  ana: 'Aoede',
  alex: 'Puck',
  narrator: 'Kore'
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function generateSpeech(text, voice = 'narrator', language = 'español') {
  const id = generateId();
  
  const voiceName = VOICES[voice.toLowerCase()] || VOICES.narrator;
  
  const prompt = language === 'español' 
    ? `Habla en español con tono profesional y educativo: ${text}`
    : `Speak in ${language} with a professional, educational tone: ${text}`;
  
  console.log(`Generating TTS with voice ${voiceName}...`);
  console.log(`Text (${text.length} chars): ${text.substring(0, 100)}...`);
  
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    });
    
    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    
    if (!inlineData || !inlineData.data) {
      throw new Error('No audio data received from TTS API');
    }
    
    const audioBuffer = Buffer.from(inlineData.data, 'base64');
    const mimeType = inlineData.mimeType || 'audio/L16';
    
    console.log(`TTS response mimeType: ${mimeType}, size: ${audioBuffer.length} bytes`);
    
    let audioPath;
    let isRawPcm = false;
    
    if (mimeType.includes('L16') || mimeType.includes('pcm')) {
      audioPath = path.join(TMP_DIR, `speech_${id}.pcm`);
      isRawPcm = true;
    } else if (mimeType.includes('wav')) {
      audioPath = path.join(TMP_DIR, `speech_${id}.wav`);
    } else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
      audioPath = path.join(TMP_DIR, `speech_${id}.mp3`);
    } else {
      audioPath = path.join(TMP_DIR, `speech_${id}.pcm`);
      isRawPcm = true;
    }
    
    fs.writeFileSync(audioPath, audioBuffer);
    console.log(`Audio saved: ${audioPath}`);
    
    const duration = isRawPcm ? estimateDuration(audioBuffer.length) : estimateDurationFromSize(audioBuffer.length);
    
    return {
      audioPath,
      mimeType,
      isRawPcm,
      duration
    };
    
  } catch (error) {
    console.error('TTS generation error:', error);
    throw error;
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateDialogue(sceneDescription, protagonists = 'Ana y Alex', language = 'español') {
  const id = generateId();
  
  const prompt = language === 'español'
    ? `Narra esta escena educativa en español con voz clara y profesional, como un documental de salud. Hazlo emotivo pero informativo: ${sceneDescription}`
    : `Narrate this educational scene in ${language} with a clear, professional voice, like a health documentary. Make it emotional but informative: ${sceneDescription}`;
  
  console.log(`Generating dialogue narration...`);
  console.log(`Scene: ${sceneDescription.substring(0, 100)}...`);
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`TTS attempt ${attempt}/${MAX_RETRIES}...`);
      
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: VOICES.narrator
              }
            }
          }
        }
      });
      
      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      
      if (!inlineData || !inlineData.data) {
        throw new Error('No audio data received from TTS API');
      }
      
      const audioBuffer = Buffer.from(inlineData.data, 'base64');
      const mimeType = inlineData.mimeType || 'audio/L16';
      
      console.log(`Dialogue TTS mimeType: ${mimeType}, size: ${audioBuffer.length} bytes`);
      
      if (audioBuffer.length < 100) {
        throw new Error('Audio data too small, likely invalid');
      }
      
      let audioPath;
      let isRawPcm = false;
      
      if (mimeType.includes('L16') || mimeType.includes('pcm')) {
        audioPath = path.join(TMP_DIR, `dialogue_${id}.pcm`);
        isRawPcm = true;
      } else if (mimeType.includes('wav')) {
        audioPath = path.join(TMP_DIR, `dialogue_${id}.wav`);
      } else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
        audioPath = path.join(TMP_DIR, `dialogue_${id}.mp3`);
      } else {
        audioPath = path.join(TMP_DIR, `dialogue_${id}.pcm`);
        isRawPcm = true;
      }
      
      fs.writeFileSync(audioPath, audioBuffer);
      console.log(`Dialogue audio saved: ${audioPath}`);
      
      if (!fs.existsSync(audioPath)) {
        throw new Error('Failed to save audio file');
      }
      
      const savedSize = fs.statSync(audioPath).size;
      if (savedSize !== audioBuffer.length) {
        throw new Error('Audio file size mismatch after save');
      }
      
      const duration = isRawPcm ? estimateDuration(audioBuffer.length) : estimateDurationFromSize(audioBuffer.length);
      
      console.log(`TTS success on attempt ${attempt}, duration: ${duration.toFixed(1)}s`);
      
      return {
        audioPath,
        mimeType,
        isRawPcm,
        duration
      };
      
    } catch (error) {
      lastError = error;
      console.error(`TTS attempt ${attempt} failed:`, error.message);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }
  
  console.error('All TTS attempts failed');
  throw lastError;
}

function estimateDuration(pcmBytes) {
  const sampleRate = 24000;
  const bytesPerSample = 2;
  const channels = 1;
  const samples = pcmBytes / (bytesPerSample * channels);
  return samples / sampleRate;
}

function estimateDurationFromSize(bytes) {
  const avgBitrate = 128000;
  return (bytes * 8) / avgBitrate;
}

export function cleanupTTSFiles(files) {
  for (const file of files) {
    if (file && fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch (e) {
        console.warn(`Failed to cleanup ${file}:`, e.message);
      }
    }
  }
}
