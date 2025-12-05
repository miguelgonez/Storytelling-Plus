import React, { useState, useRef, useEffect } from 'react';
import { VideoPage } from '../types';

interface VideoViewerProps {
  videos: VideoPage[];
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ videos }) => {
  const [selectedVideo, setSelectedVideo] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      setVideoError(null);
      setIsLoading(true);
    }
  }, [selectedVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedData = () => {
      setIsLoading(false);
      setVideoError(null);
    };
    const handleError = () => {
      setIsLoading(false);
      setVideoError('No se pudo cargar el video. El formato puede no ser compatible con tu navegador.');
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (autoPlay && selectedVideo < videos.length - 1) {
        setSelectedVideo(selectedVideo + 1);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play();
          }
        }, 500);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [autoPlay, selectedVideo, videos.length]);

  if (videos.length === 0) return null;

  const currentVideo = videos[selectedVideo];

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handlePrevious = () => {
    setSelectedVideo(Math.max(0, selectedVideo - 1));
  };

  const handleNext = () => {
    setSelectedVideo(Math.min(videos.length - 1, selectedVideo + 1));
  };

  const playAll = () => {
    setAutoPlay(true);
    setSelectedVideo(0);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    }, 100);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = videos.reduce((acc, v) => acc + v.duration, 0);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 p-4">
      <div className="flex flex-col lg:flex-row gap-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 border-2 border-blue-500/30">
        
        <div className="flex-1 flex flex-col items-center bg-black rounded-xl overflow-hidden min-h-[400px] relative">
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}ionide-logo.svg`}
              alt="ion IDe Telematics"
              className="h-8 w-auto opacity-80 drop-shadow"
            />
          </div>
          
          {isLoading && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-white text-sm">Cargando video...</span>
              </div>
            </div>
          )}
          
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <div className="text-center p-6">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <p className="text-white mb-2">{videoError}</p>
                <p className="text-slate-400 text-sm">Escena {currentVideo.pageNumber}: {currentVideo.description}</p>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            src={currentVideo.videoUrl}
            className="w-full h-auto max-h-[60vh] object-contain"
            playsInline
          />
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlayPause}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                <span className="text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(currentVideo.duration)}
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-600/80 text-sm font-semibold">
                Escena {currentVideo.pageNumber} de {videos.length}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-1/3 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center justify-between mb-4 border-b-2 border-blue-500/30 pb-2">
              <h2 className="text-2xl font-bold text-blue-400">
                Escena {currentVideo.pageNumber}
              </h2>
              <span className="text-slate-400 font-bold">{selectedVideo + 1} / {videos.length}</span>
            </div>
            
            <div className="prose prose-lg prose-invert mb-6 text-slate-300 leading-relaxed">
              <p>{currentVideo.description}</p>
            </div>

            <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>Duracion total</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoplay"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoplay" className="text-sm text-slate-300">
                  Reproduccion continua
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={playAll}
              className="w-full py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Reproducir todo
            </button>
            
            <div className="flex gap-4">
              <button 
                onClick={handlePrevious}
                disabled={selectedVideo === 0}
                className="flex-1 py-3 px-6 rounded-xl font-bold bg-slate-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                Anterior
              </button>
              <button 
                onClick={handleNext}
                disabled={selectedVideo === videos.length - 1}
                className="flex-1 py-3 px-6 rounded-xl font-bold bg-slate-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {videos.map((video, index) => (
              <button
                key={video.pageNumber}
                onClick={() => setSelectedVideo(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedVideo === index 
                    ? 'border-blue-500 ring-2 ring-blue-500/50' 
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">
                  {video.pageNumber}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
