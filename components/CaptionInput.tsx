
import React from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export const CaptionInput: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Conteúdo das Legendas
        </label>
        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-black uppercase tracking-tighter border border-indigo-100">
          Formato Obrigatório
        </span>
      </div>
      
      <div className="relative">
        <textarea 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.0 - 3.0: Legenda da primeira cena&#10;3.0 - 6.0: Legenda da segunda cena&#10;6.0 - 9.5: Call to action final"
          className="w-full h-64 p-4 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none font-mono leading-relaxed"
        />
        <div className="absolute bottom-3 right-3 opacity-20 pointer-events-none">
          <i className="fas fa-terminal text-4xl"></i>
        </div>
      </div>
      
      <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
        <p className="text-[10px] text-amber-700 font-bold leading-tight uppercase tracking-tighter">
          <i className="fas fa-info-circle mr-1"></i> Use exatamente: START - END: TEXTO
        </p>
      </div>
    </div>
  );
};
