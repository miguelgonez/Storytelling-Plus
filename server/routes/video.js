import express from 'express';
import path from 'path';
import fs from 'fs';
import { generateVideoWithWan, validateVideoRequest } from '../services/replicateClient.js';
import { processVideoFromUrl, processVideoWithSubtitles, TMP_DIR } from '../services/transcode.js';

const router = express.Router();

router.post('/generate-video', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9', narrationText, language = 'español', resolution = '480p' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ 
        error: 'Configuration error',
        message: 'REPLICATE_API_TOKEN no está configurado. Por favor, añade tu API key de Replicate.'
      });
    }
    
    console.log('\n=== Video Generation Request (Hailuo Photorealistic via Replicate) ===');
    console.log('Prompt length:', prompt.length);
    console.log('Narration text:', narrationText ? `${narrationText.length} chars` : 'none');
    console.log('Language:', language);
    
    const validation = validateVideoRequest(narrationText);
    
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Warnings:', validation.warnings);
    }
    
    console.log(`Using model: ${validation.model}`);
    
    const videoData = await generateVideoWithWan(prompt, narrationText, resolution, language);
    
    console.log('Video generated successfully');
    console.log('Video URL:', videoData.data);
    
    let outputPath;
    
    if (narrationText && narrationText.length > 0) {
      outputPath = await processVideoWithSubtitles(videoData, narrationText);
    } else {
      outputPath = await processVideoFromUrl(videoData.data);
    }
    
    const videoId = path.basename(outputPath);
    
    console.log('Video ready:', videoId);
    console.log('=== Video Generation Complete ===\n');
    
    res.json({
      success: true,
      videoId: videoId,
      videoUrl: `/api/video/${videoId}`,
      model: 'hailuo-photorealistic',
      hasSubtitles: !!(narrationText && narrationText.length > 0)
    });
    
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ 
      error: 'Video generation failed', 
      message: error.message 
    });
  }
});

router.get('/video/:videoId', (req, res) => {
  const { videoId } = req.params;
  const videoPath = path.join(TMP_DIR, videoId);
  
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    
    const file = fs.createReadStream(videoPath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-cache'
    });
    
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-cache'
    });
    
    fs.createReadStream(videoPath).pipe(res);
  }
});

export default router;
