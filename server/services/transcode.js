import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TMP_DIR = path.join(__dirname, '../../tmp');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function downloadFromUri(uri) {
  return new Promise((resolve, reject) => {
    const id = generateId();
    const tempPath = path.join(TMP_DIR, `download_${id}.mp4`);
    const file = fs.createWriteStream(tempPath);
    
    const apiKey = process.env.GEMINI_API_KEY;
    let downloadUrl = uri;
    
    if (uri.includes('generativelanguage.googleapis.com') && apiKey) {
      const separator = uri.includes('?') ? '&' : '?';
      downloadUrl = `${uri}${separator}key=${apiKey}`;
    }
    
    console.log('Downloading from:', downloadUrl.replace(apiKey || '', '***'));
    
    const urlObj = new URL(downloadUrl);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': '*/*'
      }
    };
    
    const protocol = downloadUrl.startsWith('https') ? https : http;
    
    const req = protocol.request(options, (response) => {
      console.log('Download response status:', response.statusCode);
      console.log('Content-Type:', response.headers['content-type']);
      
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        console.log('Redirecting to:', redirectUrl);
        file.close();
        fs.unlink(tempPath, () => {});
        downloadFromUri(redirectUrl)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        let errorBody = '';
        response.on('data', chunk => errorBody += chunk);
        response.on('end', () => {
          console.error('Download error response:', errorBody.substring(0, 500));
          file.close();
          fs.unlink(tempPath, () => {});
          reject(new Error(`Download failed with status ${response.statusCode}: ${errorBody.substring(0, 200)}`));
        });
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(tempPath);
        console.log('Downloaded file size:', stats.size, 'bytes');
        if (stats.size < 1000) {
          const content = fs.readFileSync(tempPath, 'utf8');
          console.error('Downloaded file too small, content:', content.substring(0, 500));
          fs.unlink(tempPath, () => {});
          reject(new Error('Downloaded file is too small, likely an error response'));
        } else {
          resolve(tempPath);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('Download request error:', err);
      file.close();
      fs.unlink(tempPath, () => {});
      reject(err);
    });
    
    req.end();
  });
}

export async function saveBytes(base64Data) {
  const id = generateId();
  const tempPath = path.join(TMP_DIR, `bytes_${id}.tmp`);
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

export async function transcodeToMp4(inputPath) {
  return new Promise((resolve, reject) => {
    const id = generateId();
    const outputPath = path.join(TMP_DIR, `video_${id}.mp4`);
    
    console.log('Starting FFmpeg transcode...');
    console.log('Input:', inputPath);
    console.log('Output:', outputPath);
    
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions([
        '-preset', 'veryfast',
        '-crf', '23',
        '-vf', 'scale=1280:-2',
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p'
      ])
      .on('start', (cmd) => {
        console.log('FFmpeg command:', cmd);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Transcoding: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on('end', () => {
        console.log('Transcode complete');
        fs.unlink(inputPath, () => {});
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        fs.unlink(inputPath, () => {});
        reject(err);
      })
      .save(outputPath);
  });
}

export async function processVideo(videoData) {
  let inputPath;
  
  if (videoData.type === 'uri') {
    console.log('Downloading video from URI...');
    inputPath = await downloadFromUri(videoData.data);
  } else if (videoData.type === 'bytes') {
    console.log('Saving video bytes to file...');
    inputPath = await saveBytes(videoData.data);
  } else {
    throw new Error('Unknown video data type');
  }
  
  const outputPath = await transcodeToMp4(inputPath);
  return outputPath;
}

export async function processVideoFromUrl(url) {
  console.log('Downloading video from URL (Replicate)...');
  const inputPath = await downloadFromUri(url);
  const outputPath = await transcodeToMp4(inputPath);
  return outputPath;
}

export async function convertToWav(audioPath, isRawPcm = false) {
  return new Promise((resolve, reject) => {
    const wavPath = audioPath.replace(/\.(pcm|mp3|wav)$/, '_converted.wav');
    
    console.log('Converting audio to WAV...');
    console.log('Input:', audioPath, 'isRawPcm:', isRawPcm);
    console.log('Output:', wavPath);
    
    let command = ffmpeg(audioPath);
    
    if (isRawPcm) {
      command = command.inputOptions([
        '-f', 's16le',
        '-ar', '24000',
        '-ac', '1'
      ]);
    }
    
    command
      .audioCodec('pcm_s16le')
      .audioFrequency(24000)
      .audioChannels(1)
      .on('start', (cmd) => {
        console.log('FFmpeg audio conversion command:', cmd);
      })
      .on('end', () => {
        console.log('Audio conversion complete');
        resolve(wavPath);
      })
      .on('error', (err) => {
        console.error('Audio conversion error:', err);
        reject(err);
      })
      .save(wavPath);
  });
}

export async function createSubtitleFile(text, duration) {
  const id = generateId();
  const srtPath = path.join(TMP_DIR, `subtitle_${id}.srt`);
  
  const words = text.split(' ');
  const wordsPerLine = 8;
  const lines = [];
  
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(' '));
  }
  
  const timePerLine = duration / lines.length;
  let srtContent = '';
  
  lines.forEach((line, index) => {
    const startTime = index * timePerLine;
    const endTime = Math.min((index + 1) * timePerLine, duration);
    
    srtContent += `${index + 1}\n`;
    srtContent += `${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n`;
    srtContent += `${line}\n\n`;
  });
  
  fs.writeFileSync(srtPath, srtContent, 'utf8');
  console.log('Subtitle file created:', srtPath);
  
  return srtPath;
}

function formatSrtTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export async function combineVideoWithAudioAndSubtitles(videoPath, audioPath, subtitleText, videoDuration, isRawPcm = false) {
  return new Promise(async (resolve, reject) => {
    const id = generateId();
    const outputPath = path.join(TMP_DIR, `final_${id}.mp4`);
    
    console.log('Combining video with audio and subtitles...');
    console.log('Video:', videoPath);
    console.log('Audio:', audioPath);
    console.log('isRawPcm:', isRawPcm);
    
    try {
      const wavPath = await convertToWav(audioPath, isRawPcm);
      
      const subtitlePath = await createSubtitleFile(subtitleText, videoDuration);
      
      const escapedSubPath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "'\\''");
      
      ffmpeg()
        .input(videoPath)
        .input(wavPath)
        .complexFilter([
          `[0:v]subtitles='${escapedSubPath}':force_style='FontSize=24,FontName=Arial,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1,MarginV=30'[v]`
        ])
        .outputOptions([
          '-map', '[v]',
          '-map', '1:a',
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-shortest',
          '-movflags', '+faststart',
          '-pix_fmt', 'yuv420p'
        ])
        .on('start', (cmd) => {
          console.log('FFmpeg combine command:', cmd);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Combining: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          console.log('Video combination complete');
          fs.unlink(wavPath, () => {});
          fs.unlink(subtitlePath, () => {});
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('FFmpeg combine error:', err);
          fs.unlink(wavPath, () => {});
          fs.unlink(subtitlePath, () => {});
          reject(err);
        })
        .save(outputPath);
        
    } catch (err) {
      reject(err);
    }
  });
}

export async function processVideoWithNarration(videoData, audioPath, subtitleText, videoDuration, isRawPcm = false) {
  let videoPath;
  
  if (videoData.type === 'uri') {
    console.log('Downloading video from URI...');
    videoPath = await downloadFromUri(videoData.data);
  } else if (videoData.type === 'bytes') {
    console.log('Saving video bytes to file...');
    videoPath = await saveBytes(videoData.data);
  } else {
    throw new Error('Unknown video data type');
  }
  
  const transcodedPath = await transcodeToMp4(videoPath);
  
  if (audioPath && fs.existsSync(audioPath)) {
    const finalPath = await combineVideoWithAudioAndSubtitles(
      transcodedPath, 
      audioPath, 
      subtitleText,
      videoDuration,
      isRawPcm
    );
    
    fs.unlink(transcodedPath, () => {});
    
    return finalPath;
  }
  
  return transcodedPath;
}

export async function processVideoWithSubtitles(videoData, subtitleText) {
  let videoPath;
  
  if (videoData.type === 'uri') {
    console.log('Downloading video from URI...');
    videoPath = await downloadFromUri(videoData.data);
  } else if (videoData.type === 'url') {
    console.log('Downloading video from URL (Replicate)...');
    videoPath = await downloadFromUri(videoData.data);
  } else if (videoData.type === 'bytes') {
    console.log('Saving video bytes to file...');
    videoPath = await saveBytes(videoData.data);
  } else {
    throw new Error('Unknown video data type: ' + videoData.type);
  }
  
  console.log('Adding subtitles to video...');
  
  const finalPath = await addSubtitlesToVideo(videoPath, subtitleText);
  
  return finalPath;
}

async function addSubtitlesToVideo(inputPath, subtitleText) {
  return new Promise(async (resolve, reject) => {
    const id = generateId();
    const outputPath = path.join(TMP_DIR, `lipsync_${id}.mp4`);
    
    console.log('Adding subtitles to lip-synced video...');
    console.log('Input:', inputPath);
    console.log('Output:', outputPath);
    
    try {
      const videoDuration = await getVideoDuration(inputPath);
      console.log('Video duration:', videoDuration, 'seconds');
      
      const subtitlePath = await createSubtitleFile(subtitleText, videoDuration);
      const escapedSubPath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "'\\''");
      
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputOptions([
          '-preset', 'veryfast',
          '-crf', '23',
          '-vf', `subtitles='${escapedSubPath}':force_style='FontSize=24,FontName=Arial,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1,MarginV=30'`,
          '-movflags', '+faststart',
          '-pix_fmt', 'yuv420p'
        ])
        .on('start', (cmd) => {
          console.log('FFmpeg subtitle overlay command:', cmd);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Adding subtitles: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          console.log('Subtitle overlay complete');
          fs.unlink(inputPath, () => {});
          fs.unlink(subtitlePath, () => {});
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('FFmpeg subtitle error:', err);
          fs.unlink(subtitlePath, () => {});
          reject(err);
        })
        .save(outputPath);
        
    } catch (err) {
      reject(err);
    }
  });
}

function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('FFprobe error:', err);
        resolve(8);
        return;
      }
      const duration = metadata.format.duration || 8;
      resolve(duration);
    });
  });
}

function cleanupOldFiles() {
  const files = fs.readdirSync(TMP_DIR);
  const now = Date.now();
  const maxAge = 30 * 60 * 1000;
  
  files.forEach(file => {
    const filePath = path.join(TMP_DIR, file);
    try {
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        console.log('Cleaned up old file:', file);
      }
    } catch (e) {
      // ignore
    }
  });
}

setInterval(cleanupOldFiles, 5 * 60 * 1000);
