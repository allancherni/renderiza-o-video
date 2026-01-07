
import React, { useState, useRef } from 'react';
import { VersionOutput } from './types';
import { parseCaptionsManual } from './services/captionService';
import { CaptionInput } from './components/CaptionInput';
import { VideoRenderer } from './components/VideoRenderer';

const App: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [rawInput, setRawInput] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [activeCaptions, setActiveCaptions] = useState<VersionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setDownloadUrl(null);
      setError(null);
      setActiveCaptions(null);
    }
  };

  const onVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setVideoDuration(e.currentTarget.duration);
  };

  const handleStartRender = () => {
    if (!rawInput.trim()) {
      setError("Por favor, insira o texto das legendas.");
      return;
    }

    if (!videoUrl) {
      setError("Por favor, carregue um vídeo de referência primeiro.");
      return;
    }
    
    setError(null);
    const parseResult = parseCaptionsManual(rawInput, videoDuration);

    if (parseResult.error) {
      setError(parseResult.error);
      return;
    }

    const structuredVersion: VersionOutput = {
      id: "RENDER_" + Date.now(),
      title: "Exportação Direta",
      captions: parseResult.captions,
      notes: "Processamento instantâneo."
    };

    setActiveCaptions(structuredVersion);
    setDownloadUrl(null);
    setIsRendering(true);
  };

  const handleRenderComplete = (url: string) => {
    setDownloadUrl(url);
    setIsRendering(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg">
              <i className="fas fa-closed-captioning text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-800 tracking-tight">CaptionPro Local</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Renderização Direta</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8">
        
        {/* Lado Esquerdo: Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fas fa-play-circle text-indigo-500"></i> 1. Importar Vídeo
            </h2>
            
            <div 
              onClick={() => !videoUrl && fileInputRef.current?.click()}
              className={`relative aspect-[9/16] max-h-[400px] rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${videoUrl ? 'border-transparent shadow-xl' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'}`}
            >
              {videoUrl ? (
                <>
                  <video 
                    ref={videoPreviewRef}
                    src={videoUrl} 
                    onLoadedMetadata={onVideoMetadata}
                    controls 
                    className="w-full h-full object-contain bg-black" 
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setVideoUrl(null); setVideoDuration(0); setDownloadUrl(null); }}
                    className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500 transition"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                  {videoDuration > 0 && (
                    <div className="absolute bottom-12 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold">
                      {videoDuration.toFixed(2)}s
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 group">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                    <i className="fas fa-file-video text-3xl text-gray-300 group-hover:text-indigo-400"></i>
                  </div>
                  <p className="text-sm text-gray-500 font-bold">Escolher Vídeo</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleVideoUpload} accept="video/*" className="hidden" />
          </section>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative h-fit">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fas fa-align-left text-indigo-500"></i> 2. Legendas
            </h2>
            <CaptionInput value={rawInput} onChange={setRawInput} />
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex gap-3">
                <i className="fas fa-exclamation-triangle mt-0.5"></i> 
                <span>{error}</span>
              </div>
            )}

            <button 
              onClick={handleStartRender}
              className="w-full mt-6 py-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200"
            >
              <i className="fas fa-video"></i>
              GERAR VÍDEO LEGENDADO
            </button>

            {downloadUrl && (
              <div className="mt-6 animate-bounce">
                <a 
                  href={downloadUrl} 
                  download="video-legendado.mp4"
                  className="w-full py-4 rounded-2xl font-black text-white shadow-xl bg-green-600 hover:bg-green-700 transition flex items-center justify-center gap-3"
                >
                  <i className="fas fa-download"></i>
                  BAIXAR RESULTADO
                </a>
              </div>
            )}
          </section>
        </div>
      </main>

      {isRendering && videoUrl && activeCaptions && (
        <VideoRenderer 
          videoUrl={videoUrl} 
          captions={activeCaptions.captions} 
          onComplete={handleRenderComplete}
          onCancel={() => setIsRendering(false)}
        />
      )}

      <footer className="py-10 px-4 mt-auto bg-white border-t">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Editor de Legendas - Fluxo Simplificado
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
