
import React, { useState, useRef, useEffect } from 'react';
import { Caption } from '../types';

interface Props {
  videoUrl: string;
  captions: Caption[];
  onComplete: (blobUrl: string, mimeType: string) => void;
  onCancel: () => void;
}

export const VideoRenderer: React.FC<Props> = ({ videoUrl, captions, onComplete, onCancel }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'PREPARING' | 'RENDERING' | 'DONE'>('PREPARING');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  const getSupportedMimeType = () => {
    const types = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp9',
      'video/webm'
    ];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
  };

  useEffect(() => {
    startRendering();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startRendering = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setStatus('PREPARING');
    setProgress(0);

    // Garante que o vídeo está carregado
    if (video.readyState < 2) {
      await new Promise((resolve) => {
        video.onloadeddata = resolve;
      });
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    setStatus('RENDERING');
    const mimeType = getSupportedMimeType();
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { 
        mimeType: mimeType,
        videoBitsPerSecond: 5000000 
    });
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      onComplete(URL.createObjectURL(blob), mimeType);
      setStatus('DONE');
    };

    video.currentTime = 0;
    recorder.start();

    const renderFrame = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const currentTime = video.currentTime;
        const activeCaption = captions.find(c => {
          const start = parseFloat(c.start.replace(',', '.'));
          const end = parseFloat(c.end.replace(',', '.'));
          return currentTime >= start && currentTime <= end;
        });

        if (activeCaption) {
          drawWrappedCaption(ctx, canvas, activeCaption.text);
        }

        setProgress(Math.min(Math.round((video.currentTime / video.duration) * 100), 100));
        requestRef.current = requestAnimationFrame(renderFrame);
      }
    };

    video.play();
    renderFrame();

    video.onended = () => {
      recorder.stop();
    };
  };

  const drawWrappedCaption = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string) => {
    const upperText = text.toUpperCase();
    const maxWidth = canvas.width * 0.85; 
    let fontSize = Math.round(canvas.height * 0.055);
    
    ctx.font = `800 ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const words = upperText.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);

    if (lines.length > 3) {
        fontSize = Math.round(canvas.height * 0.045);
        ctx.font = `800 ${fontSize}px sans-serif`;
    }

    const lineHeight = fontSize * 1.2;
    const centerX = canvas.width / 2;
    const baseY = canvas.height * 0.88; 

    lines.forEach((line, index) => {
        const lineY = baseY - (lines.length - 1 - index) * lineHeight;
        
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.round(fontSize * 0.2);
        ctx.lineJoin = 'round';
        ctx.strokeText(line, centerX, lineY);

        ctx.fillStyle = 'white';
        ctx.fillText(line, centerX, lineY);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-gray-100">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-sync-alt text-indigo-600 text-2xl animate-spin"></i>
        </div>
        <h3 className="text-xl font-black text-gray-800 mb-2">Processando Vídeo</h3>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Aguarde enquanto as legendas são embutidas. Mantenha esta janela aberta.
        </p>
        
        <div className="relative w-40 h-40 mx-auto mb-8">
          <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-100" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-indigo-600 transition-all duration-300" 
                    strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - progress} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-gray-800">{progress}%</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gravando</span>
          </div>
        </div>

        <div className="hidden">
           <video ref={videoRef} src={videoUrl} muted crossOrigin="anonymous" playsInline />
           <canvas ref={canvasRef} />
        </div>

        <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest">
              <i className="fas fa-circle-notch animate-spin"></i>
              {status === 'PREPARING' ? 'Preparando...' : 'Gravando Frames...'}
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">NÃO FECHE OU MINIMIZE O NAVEGADOR</p>
        </div>
        
        <button 
          onClick={onCancel}
          className="mt-6 text-[10px] text-gray-400 font-black uppercase tracking-widest hover:text-red-500 transition"
        >
          Cancelar Renderização
        </button>
      </div>
    </div>
  );
};
